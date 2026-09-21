// Driver Assignments Page (Accept / Reject & Navigation Trigger)
// FPP - Smart Farmer Procurement Platform

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Truck, CheckCircle2, XCircle, Navigation, Phone, MapPin } from 'lucide-react';
import { db, Trip } from '../../lib/db';

export const AssignmentsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Trip[]>([]);

  useEffect(() => {
    setAssignments(db.getCollection<Trip>('trips'));
  }, []);

  const handleAccept = (id: string) => {
    db.updateTripStatus(id, 'accepted');
    alert(t('driverAssignments.acceptedAlert', 'Pickup assignment accepted. Proceed to farm destination.'));
    navigate('/driver/active-pickup');
  };

  const handleReject = (id: string) => {
    if (confirm(t('driverAssignments.declineConfirm', 'Decline this assignment? It will be re-routed to next available vehicle.'))) {
      db.updateTripStatus(id, 'cancelled');
      setAssignments(db.getCollection<Trip>('trips'));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          📋 {t('driverAssignments.title', 'Farm Pickup Dispatches')}
        </h2>
        <p className="text-xs text-slate-500">
          {t('driverAssignments.subtitle', 'Harvest batches allocated to vehicle OD-15-AB-1024 by Mandi logistics algorithm')}
        </p>
      </div>

      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-500 border border-slate-200">
            {t('driverAssignments.noAssignments', 'No active dispatches at the moment.')}
          </div>
        ) : (
          assignments.map((trip) => (
            <div
              key={trip.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    {trip.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{t('driverAssignments.id', 'ID')}: {trip.id}</span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900">
                  {trip.farmer_name || 'Farmer Ramesh'} • {trip.crop_type || 'Paddy'} ({trip.quantity_kg || 2400} kg)
                </h3>

                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  {t('driverAssignments.village', 'Village')}: {trip.village || `Sambalpur Rural (${t('driverAssignments.farmYard', 'Farm Yard')})`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <a
                  href={`tel:${trip.farmer_phone || '+919876543201'}`}
                  className="p-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
                  title="Call Farmer"
                >
                  <Phone className="w-4 h-4" />
                </a>

                {trip.status === 'assigned' ? (
                  <>
                    <button
                      onClick={() => handleReject(trip.id)}
                      className="px-3 py-2 border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl hover:bg-rose-100 cursor-pointer"
                    >
                      {t('driverAssignments.decline', 'Decline')}
                    </button>
                    <button
                      onClick={() => handleAccept(trip.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                    >
                      {t('driverAssignments.acceptPickup', 'Accept Pickup')}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate('/driver/navigation')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{t('driverAssignments.startNavigation', 'Start Navigation')}</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
