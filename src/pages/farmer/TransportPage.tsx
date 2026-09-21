// Farmer Transport Management Page (Self vs Vehicle Switcher)
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Truck, MapPin, Phone, Clock, Navigation, CheckCircle2, 
  RotateCw, AlertTriangle, ShieldCheck, FileDown 
} from 'lucide-react';
import { db, Booking, Vehicle, ProcurementCentre, Farmer } from '../../lib/db';
import { useAuth } from '../../context/AuthContext';
import { sendSms } from '../../lib/sms';

export const TransportPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [farmer, setFarmer] = useState<Farmer>(() => db.getFarmerByUserId(user?.id));
  const [booking, setBooking] = useState<Booking | null>(null);
  const [assignedVehicle, setAssignedVehicle] = useState<Vehicle | null>(null);
  const [centre, setCentre] = useState<ProcurementCentre | null>(null);

  useEffect(() => {
    const refresh = () => {
      const currentFarmer = db.getFarmerByUserId(user?.id);
      setFarmer(currentFarmer);
      const bookings = db.getCollection<Booking>('bookings');
      const myBooking = bookings.find((b) => b.farmer_id === currentFarmer.id || b.farmer_id === user?.id) || null;
      setBooking(myBooking);

      if (myBooking) {
        const centres = db.getCollection<ProcurementCentre>('centres');
        setCentre(centres.find((c) => c.id === myBooking.centre_id) || centres[0]);

        const vehicles = db.getCollection<Vehicle>('vehicles');
        setAssignedVehicle(vehicles[0] || null);
      } else {
        setCentre(null);
        setAssignedVehicle(null);
      }
    };
    refresh();
    const unsubFarmers = db.subscribe('table:farmers', refresh);
    const unsubBookings = db.subscribe('table:bookings', refresh);
    return () => {
      unsubFarmers();
      unsubBookings();
    };
  }, [user?.id]);

  const handleChangeToSelf = () => {
    if (!booking) return;
    if (confirm('Switch to Self Transport? Assigned vehicle pickup will be cancelled.')) {
      booking.transport_mode = 'self';
      const bookings = db.getCollection<Booking>('bookings');
      const idx = bookings.findIndex((b) => b.id === booking.id);
      if (idx !== -1) {
        bookings[idx] = booking;
        db.setCollection('bookings', bookings);
      }
      setBooking({ ...booking });

      sendSms({
        phone: farmer.alternate_contact_phone || user?.phone || '+919876543201',
        message: `Booking #${booking.token_number} updated to Self Transport. Please bring your crop directly to Mandi yard.`,
        type: 'transactional',
      });
    }
  };

  const handleChangeToVehicle = () => {
    navigate('/farmer/procurement?mode=vehicle');
  };

  if (!booking) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
        <Truck className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="font-extrabold text-lg text-slate-800">{t('transport.title', 'Transport & Logistics Mode')}</h3>
        <p className="text-xs text-slate-500">{t('transport.subtitle', 'Choose how your produce reaches the Mandi: Self transport or free government vehicle pickup')}</p>
        <Link
          to="/farmer/procurement"
          className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
        >
          {t('farmerDashboard.bookSlotBtn', '🌾 Book Mandi Slot')}
        </Link>
      </div>
    );
  }

  const isVehicle = booking.transport_mode === 'vehicle';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
            isVehicle ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {isVehicle ? t('transport.vehicleOption', 'Free Government Vehicle Pickup') : t('transport.selfOption', 'Self Transport')}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            {t('transport.title', 'Transport & Logistics Mode')}
          </h2>
          <p className="text-xs text-slate-500">
            {t('slots.token', 'Token')} #{booking.token_number} ({booking.token_code}) • {booking.date} at {booking.time_slot}
          </p>
        </div>

        {/* Change Transport Mode Button */}
        {isVehicle ? (
          <button
            onClick={handleChangeToSelf}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all self-start sm:self-auto"
          >
            {t('transport.selfOption', 'Self Transport')}
          </button>
        ) : (
          <button
            onClick={handleChangeToVehicle}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all self-start sm:self-auto"
          >
            {t('transport.vehicleOption', 'Free Government Vehicle Pickup')}
          </button>
        )}
      </div>

      {/* Main Transport Card */}
      {isVehicle ? (
        /* VEHICLE TRANSPORT VIEW */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                  {t('transport.driverAssigned', 'Driver Assigned')}
                </span>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {assignedVehicle?.driver_name || 'Suresh Kumar Mohapatra'}
                </h3>
                <p className="text-xs text-slate-500">
                  {assignedVehicle?.vehicle_type} • {assignedVehicle?.registration_number}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${assignedVehicle?.driver_phone || '+919876543210'}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{t('tracking.call', 'Call Driver')}</span>
              </a>
              <Link
                to="/farmer/vehicle-tracking"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{t('transport.trackLiveBtn', 'Live GPS Tracking')}</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-2xl">
            <div>
              <span className="text-slate-400 block text-[10px]">{t('transport.pickupTime', 'Scheduled Pickup Time')}:</span>
              <span className="font-extrabold text-slate-800 text-sm">
                {booking.preferred_pickup_time || '07:30 AM'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t('procurement.pickupAddress', 'Pickup Address')}:</span>
              <span className="font-extrabold text-slate-800 text-sm">
                {booking.pickup_location || 'Nilokheri / Sambalpur Rural'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t('slots.centre', 'Procurement Centre')}:</span>
              <span className="font-extrabold text-slate-800 text-sm">
                {centre?.name || 'Sambalpur Mandi'}
              </span>
              <span className="text-[10px] text-slate-500 block">{booking.time_slot}</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">{t('transport.activeRequest', 'Active Vehicle Dispatch Request')}:</span>
              <span>
                Please keep your grain bagged in standardized 50kg bags ready at your road point. The driver will weigh the tare, load the trolley, and issue a physical digital transit slip before driving directly to the mandi weighbridge.
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* SELF TRANSPORT VIEW */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl">
                🚜
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  {t('transport.selfOption', 'Self Transport')}
                </span>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {centre?.name || 'Sambalpur Regulated Mandi Complex'}
                </h3>
                <p className="text-xs text-slate-500">
                  {centre?.address || 'Dhanupali Chowk, Sambalpur, Odisha'}
                </p>
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${centre?.latitude || 21.4550},${centre?.longitude || 83.9850}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md self-start sm:self-auto"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{t('centres.getDirections', 'Get Directions')}</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-2xl">
            <div>
              <span className="text-slate-400 block text-[10px]">{t('slots.timeSlot', 'Time Slot')}:</span>
              <span className="font-extrabold text-slate-800 text-sm">{booking.time_slot}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t('slots.mode', 'Transport Mode')}:</span>
              <span className="font-extrabold text-slate-800 text-sm">{t('transport.selfOption', 'Self Transport')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t('centres.operatingHours', 'Operating Hours')}:</span>
              <span className="font-extrabold text-slate-800 text-sm">{centre?.operating_hours || '08:30 AM - 05:30 PM'}</span>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">{t('transport.selfDesc', 'Bring your crop directly using your own tractor, trolley, or pickup vehicle.')}</span>
              <span>
                Please display your QR Token on your smartphone or carry the printed token slip. Mandi security will scan the barcode at the gate to admit your tractor into the computerized gross weighbridge.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
