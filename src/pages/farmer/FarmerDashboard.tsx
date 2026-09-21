import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Sprout, Calendar, Hourglass, Truck, ArrowRight, ShieldCheck, 
  MapPin, CheckCircle2, Clock, Phone, AlertTriangle, ExternalLink, PlusCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, Crop, Booking, QueueItem, Trip, Vehicle, Farmer } from '../../lib/db';

export const FarmerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [farmer, setFarmer] = useState<Farmer>(() => db.getFarmerByUserId(user?.id));
  const [crops, setCrops] = useState<Crop[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [queueItem, setQueueItem] = useState<QueueItem | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [assignedVehicle, setAssignedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    const refreshData = () => {
      const currentFarmer = db.getFarmerByUserId(user?.id);
      setFarmer(currentFarmer);

      const allCrops = db.getCollection<Crop>('crops');
      const myCrops = allCrops.filter(
        (c) => c.farmer_id === currentFarmer.id || c.farmer_id === user?.id
      );
      setCrops(myCrops);

      const allBookings = db.getCollection<Booking>('bookings');
      const myBookings = allBookings.filter(
        (b) => b.farmer_id === currentFarmer.id || b.farmer_id === user?.id
      );
      setBookings(myBookings);

      const allQueue = db.getCollection<QueueItem>('queue');
      const myQ = allQueue.find(
        (q) => q.farmer_id === currentFarmer.id || q.farmer_id === user?.id || (myBookings.length > 0 && q.token_code === myBookings[0].token_code)
      );
      setQueueItem(myQ || null);

      const allTrips = db.getCollection<Trip>('trips');
      const myTrip = allTrips.find(
        (t) => (t.farmer_id === currentFarmer.id || t.farmer_id === user?.id || (myBookings.length > 0 && t.booking_id === myBookings[0].id)) && t.status !== 'completed'
      );
      setActiveTrip(myTrip || null);

      if (myTrip) {
        const allVehicles = db.getCollection<Vehicle>('vehicles');
        setAssignedVehicle(allVehicles.find((v) => v.id === myTrip.vehicle_id) || null);
      } else {
        setAssignedVehicle(null);
      }
    };

    refreshData();

    // Subscribe to real-time events
    const unsubFarmers = db.subscribe('table:farmers', refreshData);
    const unsubUsers = db.subscribe('table:users', refreshData);
    const unsubCrops = db.subscribe('table:crops', refreshData);
    const unsubBookings = db.subscribe('table:bookings', refreshData);
    const unsubQueue = db.subscribe('table:queue', refreshData);
    const unsubTrips = db.subscribe('table:trips', refreshData);

    return () => {
      unsubFarmers();
      unsubUsers();
      unsubCrops();
      unsubBookings();
      unsubQueue();
      unsubTrips();
    };
  }, [user?.id]);

  const nextBooking = bookings[0] || null;
  const activeCrop = crops.find((c) => c.status === 'slot_booked' || c.status === 'vehicle_requested') || crops[0] || null;
  const farmerName = user?.name || farmer?.name || 'Farmer';
  const districtName = farmer?.district || 'Sambalpur';

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-800 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <span>{t('farmerDashboard.verifiedBeneficiary', 'Verified Aadhaar Beneficiary')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{districtName} Mandi Cluster</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('farmerDashboard.welcome', 'Welcome Farmer 👋')} {farmerName}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            {t('farmerDashboard.welcomeSubtitle', 'Your centralized procurement portal for automated 30-minute slot scheduling, free government transport vehicle dispatch, live GPS telemetry, and instant PFMS DBT bank settlement.')}
          </p>

          {/* Action Quick Buttons */}
          <div className="pt-3 flex flex-wrap items-center gap-3">
            <Link
              to="/farmer/procurement"
              className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-400/20 transition-all flex items-center gap-1.5"
            >
              <span>{t('farmerDashboard.bookSlotBtn', '🌾 Book Mandi Slot')}</span>
            </Link>
            <Link
              to="/farmer/crops"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs backdrop-blur transition-all flex items-center gap-1.5"
            >
              <Sprout className="w-3.5 h-3.5 text-emerald-300" />
              <span>Register New Crop</span>
            </Link>
            <Link
              to="/farmer/procurement?mode=vehicle"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs backdrop-blur transition-all"
            >
              {t('farmerDashboard.requestVehicleBtn', '🚚 Request Vehicle Pickup')}
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards (3 Columns Real-Time) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: My Crops */}
        <Link to="/farmer/crops" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 transition-all flex items-center justify-between group">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {t('farmerDashboard.registeredCrops', 'Registered Crops')}
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block group-hover:text-emerald-700">
              {crops.length} {t('farmerDashboard.batches', 'Batches')}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
              {crops.length > 0 
                ? `${t('farmerDashboard.totalQuintals', 'Total')} ${(crops.reduce((acc, c) => acc + (Number(c.expected_quantity_kg) || 0), 0) / 100).toFixed(1)} / 100 ${t('crops.quintals', 'Quintals')}`
                : '+ Register first crop yield (Max 100 Q)'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sprout className="w-6 h-6" />
          </div>
        </Link>

        {/* Card 2: Next Slot */}
        <Link to={nextBooking ? "/farmer/slots-tokens" : "/farmer/procurement"} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 transition-all flex items-center justify-between group">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {t('farmerDashboard.nextSlot', 'Next Mandi Slot')}
            </span>
            <span className="text-xl font-extrabold text-slate-900 mt-1 block group-hover:text-blue-700">
              {nextBooking ? nextBooking.date : t('farmerDashboard.noSlot', 'No active slot')}
            </span>
            <span className="text-[11px] text-blue-600 font-semibold block mt-0.5">
              {nextBooking ? nextBooking.time_slot : 'Click to book slot →'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </Link>

        {/* Card 3: Queue Position (Supabase Realtime) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {t('farmerDashboard.currentQueuePos', 'Current Queue Position')}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-emerald-600">
                {queueItem ? `#${queueItem.position}` : '—'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {queueItem ? t('farmerDashboard.tokensAhead', 'Tokens Ahead') : 'No Active Queue Token'}
              </span>
            </div>
            <span className="text-[11px] text-amber-600 font-semibold block mt-0.5">
              {queueItem ? `${t('farmerDashboard.estWait', 'Est. wait')}: ~${queueItem.position * 15} ${t('farmerDashboard.mins', 'mins')}` : 'Generated when slot arrives'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Hourglass className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Active Procurement Card (If Active Booking Exists) */}
      {nextBooking ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                {t('slots.title', 'Slots & Gate Pass Tokens')}
              </span>
              <h3 className="font-extrabold text-lg text-slate-900 mt-1">
                {t('slots.token', 'Token')} #{nextBooking.token_number} ({nextBooking.token_code})
              </h3>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl self-start sm:self-auto">
              {t('slots.mode', 'Transport Mode')}: {nextBooking.transport_mode === 'vehicle' ? t('slots.govtVehicle', 'Government Vehicle Pickup') : t('slots.selfTransport', 'Self Transport')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 py-4 text-xs">
            <div>
              <span className="text-slate-400 block">{t('crops.cropType', 'Crop Type')}:</span>
              <span className="font-bold text-slate-800 text-sm">
                {activeCrop?.crop_type || 'Paddy (Common)'} ({activeCrop?.expected_quantity_kg || 2400} kg)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">{t('slots.date', 'Date')} & {t('slots.timeSlot', 'Time Slot')}:</span>
              <span className="font-bold text-slate-800 text-sm">
                {nextBooking.date} • {nextBooking.time_slot}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">{t('slots.centre', 'Procurement Centre')}:</span>
              <span className="font-bold text-slate-800 text-sm">
                {districtName} Regulated Mandi Yard
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">{t('common.status', 'Status')}:</span>
              <span className="font-bold text-emerald-600 text-sm">
                {activeTrip ? activeTrip.status.replace('_', ' ').toUpperCase() : t('common.confirmed', 'CONFIRMED')}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Report at Mandi Gate 15 minutes before slot with digital QR Token.</span>
            </div>

            <div className="flex gap-2">
              <Link
                to="/farmer/transport"
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t('farmerNav.transportMode', 'Transport Mode')}
              </Link>
              {nextBooking.transport_mode === 'vehicle' && (
                <Link
                  to="/farmer/vehicle-tracking"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {t('tracking.title', 'Live GPS Vehicle Tracking')}
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty Onboarding Card for New Farmer */
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Sprout className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-extrabold text-lg text-slate-900">
              Welcome to Your Smart Kisan Dashboard!
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You do not have any active mandi procurement slots booked yet. Register your crop yield and book a 30-minute arrival slot in just 2 clicks.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/farmer/procurement"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
            >
              <span>🌾 Book Your First Mandi Slot</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/farmer/crops"
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4 text-slate-600" />
              <span>Add Crop Harvest</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
