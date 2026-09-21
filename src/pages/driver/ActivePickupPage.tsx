// Driver Active Pickup Page with Real-Time GPS Broadcast & Trip Status Updates
// FPP - Smart Farmer Procurement Platform

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LiveGpsMap } from '../../components/map/LiveGpsMap';
import { Phone, Navigation, CheckCircle2, Clock, Truck, ShieldAlert } from 'lucide-react';
import { db, Trip, Vehicle } from '../../lib/db';

export const ActivePickupPage: React.FC = () => {
  const { t } = useTranslation();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [status, setStatus] = useState<Trip['status']>('going_to_farmer');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  useEffect(() => {
    const trips = db.getCollection<Trip>('trips');
    const tItem = trips.find((item) => item.status !== 'completed') || trips[0];
    if (tItem) {
      setTrip(tItem);
      setStatus(tItem.status);
    }
  }, []);

  const handleStatusChange = (newStatus: Trip['status']) => {
    setStatus(newStatus);
    if (!trip) return;

    const updated = db.updateTripStatus(trip.id, newStatus);
    if (updated) {
      setTrip({ ...updated });
      setStatusNotification(
        t('driverActivePickup.statusNotification', {
          status: newStatus.replace('_', ' ').toUpperCase(),
          defaultValue: `Trip status updated to: ${newStatus.replace('_', ' ').toUpperCase()}. SMS sent to farmer & society officer.`
        })
      );
      setTimeout(() => setStatusNotification(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Status Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
            {t('driverActivePickup.activeMission', 'Active Logistics Mission')}
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            {t('driverActivePickup.trip', 'Trip')} #{trip?.id || 'TRIP-1024'}: {t('driverActivePickup.tripTitle', 'Farm Pickup & Mandi Delivery')}
          </h2>
          <p className="text-xs text-slate-500">
            {t('driverActivePickup.subtitle', 'Broadcasting live GPS coordinates every 10 seconds to central Mandi radar')}
          </p>
        </div>

        {/* Status Dropdown Controller */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-700">{t('driverActivePickup.updateStatus', 'Update Status:')}</span>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as Trip['status'])}
            className="p-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl outline-none cursor-pointer shadow-md"
          >
            <option value="accepted">{t('driverActivePickup.statusAccepted', '1. Accepted Pickup')}</option>
            <option value="going_to_farmer">{t('driverActivePickup.statusGoingToFarmer', '2. Going to Farmer')}</option>
            <option value="arrived">{t('driverActivePickup.statusArrived', '3. Arrived at Farm')}</option>
            <option value="picked_up">{t('driverActivePickup.statusPickedUp', '4. Crop Picked Up / Loaded')}</option>
            <option value="going_to_centre">{t('driverActivePickup.statusGoingToCentre', '5. Going to Mandi Centre')}</option>
            <option value="at_centre">{t('driverActivePickup.statusAtCentre', '6. Arrived at Mandi Gate')}</option>
            <option value="completed">{t('driverActivePickup.statusCompleted', '7. Completed & Delivered')}</option>
          </select>
        </div>
      </div>

      {statusNotification && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2 animate-slide-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Live Map Component */}
      <LiveGpsMap isDriverView={true} vehicleId="veh-01" tripId={trip?.id || 'trip-01'} centreId="cen-03" />

      {/* Details & Actions Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-400 block text-[10px]">{t('driverActivePickup.farmerAndCrop', 'Farmer & Crop:')}</span>
          <span className="font-bold text-slate-900 text-sm">{trip?.farmer_name || 'Ramesh Chandra Pradhan'}</span>
          <span className="text-slate-500 block">{trip?.crop_type || t('driverActivePickup.paddyCommon', 'Paddy (Common)')} • {trip?.quantity_kg || 2400} kg</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-400 block text-[10px]">{t('driverActivePickup.farmLocation', 'Farm Location:')}</span>
          <span className="font-bold text-slate-900 text-sm">{trip?.village || 'Nuapali / Sambalpur Rural'}</span>
          <span className="text-slate-500 block">{t('driverActivePickup.canalCrossing', 'Main Canal Road Crossing')}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[10px]">{t('driverActivePickup.directContact', 'Direct Contact:')}</span>
            <span className="font-bold text-slate-900">{trip?.farmer_phone || '+91 98765 43201'}</span>
          </div>

          <a
            href={`tel:${trip?.farmer_phone || '+919876543201'}`}
            className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{t('driverActivePickup.callFarmer', 'Call Farmer')}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
