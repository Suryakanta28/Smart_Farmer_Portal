// Slots & Tokens History and QR Code Viewer for Farmer
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Ticket, QrCode, Calendar, MapPin, Printer, CheckCircle2 } from 'lucide-react';
import { db, Booking, ProcurementCentre, Farmer } from '../../lib/db';
import { useAuth } from '../../context/AuthContext';
import { generateTokenPdf } from '../../lib/pdf';

export const SlotsTokensPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [farmer, setFarmer] = useState<Farmer>(() => db.getFarmerByUserId(user?.id));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedTokenModal, setSelectedTokenModal] = useState<Booking | null>(null);

  useEffect(() => {
    const refresh = () => {
      const currentFarmer = db.getFarmerByUserId(user?.id);
      setFarmer(currentFarmer);
      const allBookings = db.getCollection<Booking>('bookings');
      const myBookings = allBookings.filter(
        (b) => b.farmer_id === currentFarmer.id || b.farmer_id === user?.id
      );
      setBookings(myBookings);
    };
    refresh();
    const unsubFarmers = db.subscribe('table:farmers', refresh);
    const unsubBookings = db.subscribe('table:bookings', refresh);
    return () => {
      unsubFarmers();
      unsubBookings();
    };
  }, [user?.id]);

  const handlePrint = (b: Booking) => {
    const centres = db.getCollection<ProcurementCentre>('centres');
    const c = centres.find((cnt) => cnt.id === b.centre_id) || centres[0];

    generateTokenPdf({
      tokenCode: b.token_code,
      tokenNumber: b.token_number,
      farmerName: farmer.name || user?.name || 'Farmer',
      farmerPhone: farmer.alternate_contact_phone || user?.phone || '+919876543201',
      village: b.pickup_location || farmer.village || 'Sambalpur Rural',
      district: farmer.district || 'Sambalpur',
      cropType: 'Paddy (Common)',
      cropQuantityKg: 2400,
      centreName: c?.name || 'Sambalpur Mandi',
      centreAddress: c?.address || 'Sambalpur, Odisha',
      date: b.date,
      timeSlot: b.time_slot,
      transportMode: b.transport_mode,
      driverName: 'Logistics Fleet Driver',
      driverPhone: '+919876543210',
      pickupTime: b.preferred_pickup_time,
      isOfflineFarmer: false,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {t('slots.title', 'Slots & Gate Pass Tokens')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('slots.subtitle', 'View your confirmed appointment tokens, QR barcodes, and transport instructions')}
          </p>
        </div>
        <Link
          to="/farmer/procurement"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          + Book New Slot
        </Link>
      </div>

      {bookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {t('slots.token', 'Token')} #{b.token_number}
                </span>
                <span className="text-xs font-bold text-slate-500 font-mono">
                  {b.token_code}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t('slots.date', 'Date')}:</span>
                  <span className="font-bold text-slate-800">{b.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t('slots.timeSlot', 'Time Slot')}:</span>
                  <span className="font-bold text-slate-800">{b.time_slot}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t('slots.mode', 'Transport Mode')}:</span>
                  <span className="font-bold text-emerald-700 capitalize">
                    {b.transport_mode === 'vehicle' ? t('slots.govtVehicle', 'Government Vehicle Pickup') : t('slots.selfTransport', 'Self Transport')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t('common.status', 'Status')}:</span>
                  <span className="font-bold text-blue-600 uppercase">{b.status}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedTokenModal(b)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-emerald-600 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{t('slots.viewQr', 'View QR Code')}</span>
                </button>

                <button
                  onClick={() => handlePrint(b)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('slots.printPdf', 'Print PDF Pass')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-base text-slate-900">No Gate Pass Tokens Found</h4>
            <p className="text-xs text-slate-500 mt-1">You haven't booked any Mandi slots yet. Book your first arrival slot to receive a digital token QR pass.</p>
          </div>
          <Link
            to="/farmer/procurement"
            className="inline-flex px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
          >
            🌾 Book Mandi Slot Now
          </Link>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="font-extrabold text-lg text-slate-900">
              {t('procurement.stepSuccess', 'Gate Pass Token')}
            </h3>
            <p className="text-xs text-slate-500">
              {t('slots.token', 'Token')} {selectedTokenModal.token_code} • #{selectedTokenModal.token_number}
            </p>

            <div className="w-48 h-48 mx-auto bg-slate-50 rounded-2xl border-2 border-dashed border-emerald-500 flex items-center justify-center p-2">
              <QrCode className="w-36 h-36 text-slate-900" />
            </div>

            <p className="text-[11px] text-slate-500 leading-tight">
              Present this barcode at Mandi Entry Weighbridge for automated optical scanner verification.
            </p>

            <button
              onClick={() => setSelectedTokenModal(null)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
            >
              {t('slots.close', 'Close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
