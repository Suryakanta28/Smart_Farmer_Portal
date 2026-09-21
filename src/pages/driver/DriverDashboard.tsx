// Vehicle Driver Dashboard Home with Online/Offline Toggle & Live Geolocation
// FPP - Smart Farmer Procurement Platform

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Truck, Navigation, CheckCircle2, Clock, MapPin, Power, 
  Phone, ArrowRight, ShieldCheck, Play 
} from 'lucide-react';
import { db, Trip, Vehicle } from '../../lib/db';
import { useAuth } from '../../context/AuthContext';

export const DriverDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentAddress, setCurrentAddress] = useState('Sambalpur Bypass Road, Near PACS Hub');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number }>({
    lat: 21.4680,
    lng: 83.9780,
  });

  useEffect(() => {
    setTrips(db.getCollection<Trip>('trips'));

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setCurrentAddress(`${t('driverDashboard.liveGps', 'Live GPS')}: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E (${t('driverDashboard.sambalpurZone', 'Sambalpur Zone')})`);
      });
    }
  }, [t]);

  const vehicles = db.getCollection<Vehicle>('vehicles');
  const assignedVehicle = vehicles.find((v) => (user?.phone && v.driver_phone?.includes(user.phone)) || (user?.name && v.driver_name?.toLowerCase() === user.name.toLowerCase())) || vehicles[0];
  const vehicleReg = assignedVehicle?.registration_number || 'OD-15-AB-1024';
  const activeTrip = trips.find((t) => t.status !== 'completed') || trips[0];
  const completedTrips = trips.filter((t) => t.status === 'completed');

  const toggleOnline = () => {
    setIsOnline(!isOnline);
    // Update driver vehicle status in db
    if (assignedVehicle) {
      assignedVehicle.status = !isOnline ? 'available' : 'offline';
      db.setCollection('vehicles', vehicles);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Card with Online / Offline Toggle */}
      <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <span>{t('driverDashboard.dispatchTerminal', 'Logistics Dispatch Terminal')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>{t('driverDashboard.vehicle', 'Vehicle')}: {vehicleReg}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('driverDashboard.driverConsole', 'Driver Console')}: {user?.name || 'Logistics Fleet Driver'}
          </h1>
          <p className="text-xs text-slate-300 flex items-center gap-1.5 pt-1">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{currentAddress}</span>
          </p>
        </div>

        {/* Online / Offline Toggle */}
        <button
          onClick={toggleOnline}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-xs shadow-xl transition-all self-start sm:self-auto ${
            isOnline
              ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/30'
              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>
            {isOnline
              ? t('driverDashboard.onlineStatus', 'YOU ARE ONLINE (RECEIVING PICKUPS)')
              : t('driverDashboard.offlineStatus', 'OFFLINE (CLICK TO GO ONLINE)')}
          </span>
        </button>
      </div>

      {/* Stats Cards (4 Columns Real-Time) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {t('driverDashboard.todaysAssignments', "Today's Assignments")}
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
            {trips.length + 2} {t('driverDashboard.trips', 'Trips')}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
            {t('driverDashboard.ruralCluster', 'Sambalpur Rural Cluster')}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {t('driverDashboard.pendingFarmPickups', 'Pending Farm Pickups')}
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-500 mt-1 block">
            {trips.filter((t) => t.status !== 'completed').length} {t('driverDashboard.pickups', 'Pickups')}
          </span>
          <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
            {t('driverDashboard.grainReady', 'Grain ready at village')}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {t('driverDashboard.activePickupStatus', 'Active Pickup Status')}
          </span>
          <span className="text-sm font-extrabold text-blue-600 mt-2 block uppercase truncate">
            {activeTrip ? activeTrip.status.replace('_', ' ') : t('driverDashboard.standby', 'STANDBY')}
          </span>
          <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
            {t('driverDashboard.miniTruckEnRoute', 'Mini Truck En Route')}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {t('driverDashboard.completedTrips', 'Completed Trips')}
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 block">
            {completedTrips.length + 4} {t('driverDashboard.trips', 'Trips')}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
            {t('driverDashboard.deliveredToMandi', 'Delivered to Mandi')}
          </span>
        </div>
      </div>

      {/* Active Pickup Summary Card */}
      {activeTrip && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                {t('driverDashboard.activeAssignment', 'Active Assignment')} #{activeTrip.id}
              </span>
              <h3 className="font-extrabold text-lg text-slate-900 mt-1">
                {t('driverDashboard.pickup', 'Pickup')}: {activeTrip.farmer_name || 'Ramesh Chandra Pradhan'}
              </h3>
              <p className="text-xs text-slate-500">
                {t('driverDashboard.destination', 'Destination')}: {activeTrip.village || `Sambalpur Rural (${t('driverDashboard.farmYard', 'Farm Yard')})`} • {activeTrip.quantity_kg || 2400} {t('driverDashboard.kgPaddy', 'kg Paddy')}
              </p>
            </div>

            <div className="flex gap-2">
              <a
                href={`tel:${activeTrip.farmer_phone || '+919876543201'}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{t('driverDashboard.callFarmer', 'Call Farmer')}</span>
              </a>

              <Link
                to="/driver/active-pickup"
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{t('driverDashboard.openActiveTripMap', 'Open Active Trip Map')}</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl">
            <div>
              <span className="text-slate-400 block text-[10px]">{t('driverDashboard.cropAndVolume', 'Crop & Volume')}:</span>
              <span className="font-bold text-slate-800 text-sm">{activeTrip.crop_type || 'Paddy'} ({activeTrip.quantity_kg || 2400} kg)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t('driverDashboard.targetMandiYard', 'Target Mandi Yard')}:</span>
              <span className="font-bold text-slate-800 text-sm">{t('driverDashboard.targetMandiName', 'Sambalpur Regulated Mandi')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t('driverDashboard.currentStatus', 'Current Status')}:</span>
              <span className="font-bold text-emerald-600 text-sm uppercase">{activeTrip.status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
