import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Sprout, MapPin, Truck, Calendar, CheckCircle2, ArrowRight, 
  ArrowLeft, Clock, Phone, AlertCircle, Navigation, FileDown 
} from 'lucide-react';
import { db, ProcurementCentre, Vehicle, Crop, Farmer } from '../../lib/db';
import { useAuth } from '../../context/AuthContext';
import { InteractiveMap } from '../../components/map/InteractiveMap';
import { generateTokenPdf } from '../../lib/pdf';
import { sendSms } from '../../lib/sms';

export const ProcurementFlow: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = (searchParams.get('mode') as 'self' | 'vehicle') || 'self';

  const [farmer, setFarmer] = useState<Farmer>(() => db.getFarmerByUserId(user?.id));

  useEffect(() => {
    const refresh = () => {
      const f = db.getFarmerByUserId(user?.id);
      setFarmer(f);
      setPickupLocation((prev) => prev || `${f.village}, ${f.district}`);
      setAlternatePhone((prev) => prev || f.alternate_contact_phone || user?.phone || '+919876549900');
    };
    refresh();
    const unsub = db.subscribe('table:farmers', refresh);
    return () => unsub();
  }, [user?.id]);

  // Step state: 1 (Crop), 2 (Centre), 3 (Transport Selection), 4A (Self Slot), 4B (Vehicle Req), 5B (Vehicle Slot), 6 (Success)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [transportMode, setTransportMode] = useState<'self' | 'vehicle'>(initialMode);

  // Form states
  const [cropType, setCropType] = useState('Paddy (Common)');
  const [cropQuantityKg, setCropQuantityKg] = useState<number>(2400);
  const [step1Error, setStep1Error] = useState<string>('');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);

  const centres = db.getCollection<ProcurementCentre>('centres');
  const [selectedCentre, setSelectedCentre] = useState<ProcurementCentre>(centres[0]);

  // Self Transport Slot
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM - 10:30 AM');

  // Vehicle Request Form
  const [pickupLocation, setPickupLocation] = useState(() => `${farmer.village}, ${farmer.district}`);
  const [pickupAddress, setPickupAddress] = useState('House #42, Main Canal Road, Near Primary Health Centre');
  const [preferredPickupTime, setPreferredPickupTime] = useState('07:30 AM');
  const [specialInstructions, setSpecialInstructions] = useState('Crop packed in standard 50kg jute bags');
  const [alternatePhone, setAlternatePhone] = useState(() => farmer.alternate_contact_phone || user?.phone || '+919876549900');

  // Vehicle matching state
  const [vehiclePending, setVehiclePending] = useState(false);
  const [assignedDriver, setAssignedDriver] = useState<Vehicle | null>(null);

  // Generated token state
  const [generatedToken, setGeneratedToken] = useState<{ token_code: string; token_number: number } | null>(null);

  // Live bookings subscription for real-time slot occupancy
  const [allBookings, setAllBookings] = useState<any[]>(() => db.getCollection('bookings'));

  useEffect(() => {
    const refreshBookings = () => {
      setAllBookings(db.getCollection('bookings'));
    };
    refreshBookings();
    const unsub = db.subscribe('table:bookings', refreshBookings);
    return () => unsub();
  }, []);

  // Slots generation (7 days x 30 min intervals)
  const daysList = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + (i + 1) * 86400000);
    return d.toISOString().split('T')[0];
  });

  const timeSlotsAll = [
    '09:00 AM - 09:30 AM',
    '09:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '11:00 AM - 11:30 AM',
    '11:30 AM - 12:00 PM',
    '12:00 PM - 12:30 PM',
    '12:30 PM - 01:00 PM',
    '02:00 PM - 02:30 PM',
    '02:30 PM - 03:00 PM',
    '03:00 PM - 03:30 PM',
    '03:30 PM - 04:00 PM',
    '04:00 PM - 04:30 PM',
    '04:30 PM - 05:00 PM',
  ];

  const timeSlotsVehicle = [
    '09:30 AM - 10:00 AM',
    '10:30 AM - 11:00 AM',
    '11:30 AM - 12:00 PM',
    '02:30 PM - 03:00 PM',
    '03:30 PM - 04:00 PM',
    '04:30 PM - 05:00 PM',
  ];

  // Dynamically calculate booked slots for a specific date & centre
  const getBookedSlotsForDate = (dateStr: string, centreId: string): string[] => {
    // 1. Real bookings in database
    const realBookedSlots = allBookings
      .filter((b) => b.centre_id === centreId && b.date === dateStr && b.status !== 'cancelled')
      .map((b) => b.time_slot);

    // 2. Realistic date-based dynamic pattern so every day has distinct slot traffic
    const parsedDate = new Date(dateStr + 'T00:00:00');
    const daySeed = parsedDate.getDate() * 19 + (parsedDate.getMonth() + 1) * 37 + (centreId?.charCodeAt(centreId.length - 1) || 3) * 11;

    const idx1 = (daySeed) % 12;
    const idx2 = (daySeed + 4) % 12;
    const idx3 = (daySeed % 2 === 0) ? (daySeed + 7) % 12 : -1;

    const simulatedSlots = [idx1, idx2, idx3]
      .filter((idx) => idx >= 0)
      .map((idx) => timeSlotsAll[idx]);

    return Array.from(new Set([...realBookedSlots, ...simulatedSlots]));
  };

  // When date or centre changes, ensure the selectedSlot is not an already-booked slot
  useEffect(() => {
    const booked = getBookedSlotsForDate(selectedDate, selectedCentre?.id || 'cen-03');
    if (booked.includes(selectedSlot)) {
      const activeList = transportMode === 'vehicle' ? timeSlotsVehicle : timeSlotsAll;
      const available = activeList.find((s) => !booked.includes(s));
      if (available) {
        setSelectedSlot(available);
      }
    }
  }, [selectedDate, selectedCentre?.id, transportMode, allBookings]);

  // Step 1 -> Step 2
  const handleStep1Next = () => {
    if (!cropQuantityKg || cropQuantityKg <= 0) {
      setStep1Error('Please enter a valid positive crop weight.');
      return;
    }
    if (cropQuantityKg > 10000) {
      setStep1Error('Maximum crop weight limit is 100 Quintals (10,000 kg). Cannot add crop above 100 Quintals.');
      return;
    }
    setStep1Error('');
    db.addCrop({
      farmer_id: farmer.id || 'far-01',
      crop_type: cropType,
      expected_quantity_kg: cropQuantityKg,
      harvest_date: harvestDate,
    });
    setCurrentStep(2);
  };

  // Step 2 -> Step 3
  const handleStep2Next = () => {
    setCurrentStep(3);
  };

  // Step 3 Transport selection
  const handleStep3Next = () => {
    if (transportMode === 'self') {
      setCurrentStep(41); // Step 4A
    } else {
      setCurrentStep(42); // Step 4B
    }
  };

  // Step 4A: Confirm Self Transport Slot
  const handleConfirmSelfSlot = () => {
    const booking = db.bookSelfTransportSlot({
      farmer_id: farmer.id || 'far-01',
      centre_id: selectedCentre.id,
      date: selectedDate,
      time_slot: selectedSlot,
      farmerName: farmer.name || user?.name || 'Ramesh Chandra Pradhan',
      farmerPhone: farmer.alternate_contact_phone || user?.phone || '+919876543201',
    });

    setGeneratedToken({
      token_code: booking.token_code,
      token_number: booking.token_number,
    });
    setCurrentStep(6);
  };

  // Step 4B: Submit Vehicle Request
  const handleSubmitVehicleRequest = () => {
    setVehiclePending(true);

    const { vehicleRequest, assignedVehicle } = db.submitVehicleRequest({
      farmer_id: farmer.id || 'far-01',
      crop_quantity_kg: cropQuantityKg,
      pickup_location: pickupLocation || `${farmer.village}, ${farmer.district}`,
      pickup_latitude: farmer.latitude || 21.4820,
      pickup_longitude: farmer.longitude || 83.9620,
      preferred_pickup_time: preferredPickupTime,
      special_instructions: specialInstructions,
      alternate_phone: alternatePhone || farmer.alternate_contact_phone || user?.phone || '+919876549900',
      farmerName: farmer.name || user?.name || 'Ramesh Chandra Pradhan',
      farmerPhone: farmer.alternate_contact_phone || user?.phone || '+919876543201',
    });

    setTimeout(() => {
      setAssignedDriver(assignedVehicle);
      setVehiclePending(false);
    }, 1200);
  };

  // Step 5B: Confirm Vehicle Slot Booking (After Vehicle Assigned)
  const handleConfirmVehicleSlot = () => {
    const booking = db.confirmVehicleSlotBooking({
      farmer_id: farmer.id || 'far-01',
      centre_id: selectedCentre.id,
      date: selectedDate,
      time_slot: selectedSlot,
      pickup_location: pickupLocation || `${farmer.village}, ${farmer.district}`,
      pickup_latitude: farmer.latitude || 21.4820,
      pickup_longitude: farmer.longitude || 83.9620,
      preferred_pickup_time: preferredPickupTime,
      farmerName: farmer.name || user?.name || 'Ramesh Chandra Pradhan',
      farmerPhone: farmer.alternate_contact_phone || user?.phone || '+919876543201',
      driverName: assignedDriver?.driver_name,
      driverPhone: assignedDriver?.driver_phone,
    });

    setGeneratedToken({
      token_code: booking.token_code,
      token_number: booking.token_number,
    });
    setCurrentStep(6);
  };

  const handleDownloadPdf = () => {
    if (!generatedToken) return;
    generateTokenPdf({
      tokenCode: generatedToken.token_code,
      tokenNumber: generatedToken.token_number,
      farmerName: farmer.name || user?.name || 'Ramesh Chandra Pradhan',
      farmerPhone: farmer.alternate_contact_phone || user?.phone || '+919876543201',
      village: pickupLocation || farmer.village,
      district: farmer.district || 'Sambalpur',
      cropType,
      cropQuantityKg,
      centreName: selectedCentre.name,
      centreAddress: selectedCentre.address,
      date: selectedDate,
      timeSlot: selectedSlot,
      transportMode,
      driverName: assignedDriver?.driver_name,
      driverPhone: assignedDriver?.driver_phone,
      pickupTime: preferredPickupTime,
      isOfflineFarmer: false,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
          {t('procurement.step1', '1. Crop Details')} • {t('procurement.title', 'Procurement Scheduling Wizard')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          {t('procurement.title', 'Procurement Scheduling Wizard')}
        </h1>
        <p className="text-xs text-slate-500">
          {t('procurement.subtitle', 'Step-by-step smart allocation for Mandi yard arrival or government transport pickup')}
        </p>
      </div>

      {/* Main Step Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200">
        {/* STEP 1: Add Crop */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-600" />
              {t('procurement.step1', '1. Crop Details')}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('procurement.selectCrop', 'Select Declared Crop')} *</label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none font-semibold text-xs"
                >
                  <option value="Paddy (Common)">Paddy (Common) - MSP ₹ 2,300/Q</option>
                  <option value="Paddy (Grade A)">Paddy (Grade A) - MSP ₹ 2,320/Q</option>
                  <option value="Wheat (Sharbati)">Wheat (Sharbati) - MSP ₹ 2,425/Q</option>
                  <option value="Wheat (Standard)">Wheat (Standard) - MSP ₹ 2,275/Q</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">
                    {t('procurement.quantityKg', 'Total Crop Weight (kg)')} *
                  </label>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Max Limit: 100 Quintals (10,000 kg)
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min={1}
                  max={10000}
                  value={cropQuantityKg || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCropQuantityKg(val);
                    if (val > 10000) {
                      setStep1Error('Maximum crop weight limit is 100 Quintals (10,000 kg). Cannot add crop above 100 Quintals.');
                    } else if (val <= 0) {
                      setStep1Error('Please enter a valid positive weight.');
                    } else {
                      setStep1Error('');
                    }
                  }}
                  className={`w-full p-3 bg-slate-50 border rounded-xl outline-none font-bold text-xs transition-colors ${
                    cropQuantityKg > 10000
                      ? 'border-rose-500 bg-rose-50/40 text-rose-900 ring-1 ring-rose-500'
                      : 'border-slate-300 focus:border-emerald-500'
                  }`}
                  placeholder="Enter weight in kg (Max 10000 kg)"
                />
                <div className="flex items-center justify-between text-[11px] mt-1.5">
                  <span className={`font-semibold ${cropQuantityKg > 10000 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                    = {(cropQuantityKg / 100).toFixed(2)} {t('crops.quintals', 'Quintals')}
                  </span>
                  <span className={`text-[11px] font-medium ${cropQuantityKg > 10000 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {cropQuantityKg > 10000 
                      ? '⚠️ Exceeds 100 Q Max Limit' 
                      : `Quota usage: ${Math.min(100, Math.round((cropQuantityKg / 10000) * 100))}%`}
                  </span>
                </div>

                {step1Error && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2 mt-2 animate-shake">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                    <span>{step1Error}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('crops.harvestDate', 'Expected Harvest Date')} *</label>
                <input
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none text-xs"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleStep1Next}
                disabled={cropQuantityKg > 10000 || cropQuantityKg <= 0}
                className={`px-6 py-2.5 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all ${
                  cropQuantityKg > 10000 || cropQuantityKg <= 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <span>{t('procurement.nextStep', 'Continue to Next Step')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Select Procurement Centre */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              {t('procurement.step2', '2. Mandi Centre')}
            </h3>

            <InteractiveMap
              selectedCentreId={selectedCentre.id}
              onSelectCentre={(c) => setSelectedCentre(c)}
            />

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> {t('procurement.previousStep', 'Back')}
              </button>
              <button
                onClick={handleStep2Next}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
              >
                <span>{t('procurement.nextStep', 'Continue to Next Step')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Transport Selection */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                {t('procurement.transportHeading', 'Choose Your Logistics Transport Mode')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t('procurement.subtitle', 'Dynamic path selection based on your transport choice')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Choice A: Self Transport */}
              <label
                onClick={() => setTransportMode('self')}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  transportMode === 'self'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-md'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="space-y-3">
                  <span className="text-3xl">🚜</span>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">
                      {t('procurement.optionSelfTitle', 'Option A: Self Transport (Tractor/Trolley)')}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('procurement.optionSelfDesc', 'Direct 7-day 30-minute interval slot booking at the mandi yard.')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-700">{t('slots.selfTransport', 'Self Transport')}</span>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${transportMode === 'self' ? 'border-emerald-600 bg-emerald-600 text-white text-[10px]' : 'border-slate-300'}`}>
                    {transportMode === 'self' && '✓'}
                  </span>
                </div>
              </label>

              {/* Choice B: Request Vehicle */}
              <label
                onClick={() => setTransportMode('vehicle')}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  transportMode === 'vehicle'
                    ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="space-y-3">
                  <span className="text-3xl">🚚</span>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">
                      {t('procurement.optionVehTitle', 'Option B: Request Vehicle Pickup (Free Government Dispatch)')}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('procurement.optionVehDesc', 'Nearest available vehicle is dispatched to your village with live GPS tracking.')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-700">{t('transport.vehicleOption', 'Free Government Vehicle Pickup')}</span>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${transportMode === 'vehicle' ? 'border-blue-600 bg-blue-600 text-white text-[10px]' : 'border-slate-300'}`}>
                    {transportMode === 'vehicle' && '✓'}
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> {t('procurement.previousStep', 'Back')}
              </button>
              <button
                onClick={handleStep3Next}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
              >
                <span>{t('procurement.nextStep', 'Continue to Next Step')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4A: Direct Slot Booking (Self Transport) */}
        {currentStep === 41 && (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                {t('transport.selfOption', 'Self Transport')}
              </span>
              <h3 className="font-extrabold text-lg text-slate-900 mt-1 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                {t('procurement.step4Self', '4. Book Slot')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('procurement.selectTimeSlot', 'Select 30-Minute Weighing Slot')}
              </p>
            </div>

            {/* Date Picker Horizontal Bar */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
              {daysList.map((d) => {
                const dayBooked = getBookedSlotsForDate(d, selectedCentre?.id || 'cen-03');
                const availableCount = timeSlotsAll.length - dayBooked.length;
                const isSelected = selectedDate === d;
                const dateObj = new Date(d + 'T00:00:00');

                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`p-3 rounded-2xl border text-center text-xs shrink-0 min-w-[110px] transition-all relative cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-lg ring-2 ring-emerald-600/30'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white shadow-sm'
                    }`}
                  >
                    <span className="block text-[10px] uppercase tracking-wider font-semibold opacity-80">
                      {dateObj.toLocaleDateString('en-IN', { weekday: 'short', month: 'short' })}
                    </span>
                    <span className="font-black text-lg my-0.5 block">
                      {dateObj.getDate()}
                    </span>
                    <span
                      className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : availableCount <= 6
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {availableCount} {t('procurement.available', 'Slots')}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Time Slot Grid */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-800">
                  {t('procurement.selectTimeSlot', 'Select 30-Minute Weighing Slot')} ({new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}):
                </span>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    🟢 {timeSlotsAll.length - getBookedSlotsForDate(selectedDate, selectedCentre?.id || 'cen-03').length} Available
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    🔴 {getBookedSlotsForDate(selectedDate, selectedCentre?.id || 'cen-03').length} Booked
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {timeSlotsAll.map((slot, idx) => {
                  const bookedOnThisDate = getBookedSlotsForDate(selectedDate, selectedCentre?.id || 'cen-03');
                  const isBooked = bookedOnThisDate.includes(slot);
                  const isSelected = selectedSlot === slot;

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-2xl border text-center font-semibold transition-all ${
                        isBooked
                          ? 'bg-rose-50/70 border-rose-200 text-rose-400 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600/30'
                          : 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-950 cursor-pointer'
                      }`}
                    >
                      <span className="font-bold">{slot}</span>
                      <span className="block text-[9px] mt-0.5 font-bold">
                        {isBooked ? '⛔ Booked' : isSelected ? '✓ Selected' : '🟢 Available'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> {t('procurement.previousStep', 'Back')}
              </button>
              <button
                onClick={handleConfirmSelfSlot}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('procurement.confirmBooking', 'Confirm & Generate Official Token')}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4B: Vehicle Request Form */}
        {currentStep === 42 && (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                {t('transport.vehicleOption', 'Free Government Vehicle Pickup')}
              </span>
              <h3 className="font-extrabold text-lg text-slate-900 mt-1 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                {t('procurement.step4Veh', '4. Vehicle Details')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('procurement.optionVehDesc', 'Nearest available vehicle is dispatched to your village with live GPS tracking.')}
              </p>
            </div>

            {!assignedDriver && !vehiclePending && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('procurement.pickupAddress', 'Pickup Address / Village Landmark')} *</label>
                  <input
                    type="text"
                    required
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('procurement.pickupAddress', 'Pickup Address')} *</label>
                  <textarea
                    rows={2}
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{t('transport.pickupTime', 'Scheduled Pickup Time')} *</label>
                    <select
                      value={preferredPickupTime}
                      onChange={(e) => setPreferredPickupTime(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-semibold cursor-pointer"
                    >
                      <option value="06:30 AM">06:30 AM (Early Morning Slot)</option>
                      <option value="07:30 AM">07:30 AM (Standard Morning Slot)</option>
                      <option value="08:30 AM">08:30 AM (Mid Morning Slot)</option>
                      <option value="11:30 AM">11:30 AM (Afternoon Slot)</option>
                      <option value="01:30 PM">01:30 PM (Late Afternoon Slot)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{t('transport.driverPhone', 'Emergency Contact Phone')} *</label>
                    <input
                      type="tel"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('procurement.specialInstructions', 'Packaging / Transport Instructions')}</label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. 50kg standard jute bags, keep tarpaulin ready..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> {t('procurement.previousStep', 'Back')}
                  </button>
                  <button
                    onClick={handleSubmitVehicleRequest}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <Truck className="w-4 h-4" />
                    <span>{t('procurement.dispatchTractor', 'Request Nearby Vehicle Dispatch')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Matching Loader */}
            {vehiclePending && (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto"></div>
                <div>
                  <h4 className="font-bold text-base text-slate-800">
                    {t('procurement.matchingEngine', 'AI Logistics Dispatch Active')}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Matching nearest available GPS vehicle in your sector...
                  </p>
                </div>
              </div>
            )}

            {/* Vehicle Assigned Card */}
            {assignedDriver && !vehiclePending && (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded">
                      Vehicle Successfully Assigned ✓
                    </span>
                    <h4 className="font-extrabold text-lg text-slate-900 mt-1">
                      {assignedDriver.driver_name}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {assignedDriver.vehicle_type} • Reg: {assignedDriver.registration_number}
                    </p>
                  </div>
                  <a
                    href={`tel:${assignedDriver.driver_phone}`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" /> {t('tracking.call', 'Call')}
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-emerald-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">{t('transport.pickupTime', 'Scheduled Pickup Time')}:</span>
                    <span className="font-bold text-slate-800 text-sm">{preferredPickupTime}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Vehicle Capacity:</span>
                    <span className="font-bold text-slate-800 text-sm">{assignedDriver.capacity_kg} kg</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setCurrentStep(52)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <span>{t('procurement.step5Veh', '5. Mandi Slot')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5B: Slot Booking (After Vehicle Assigned) */}
        {currentStep === 52 && (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                {t('procurement.step5Veh', '5. Mandi Slot')}
              </span>
              <h3 className="font-extrabold text-lg text-slate-900 mt-1 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                {t('procurement.selectTimeSlot', 'Select 30-Minute Weighing Slot')}
              </h3>
              <p className="text-xs text-slate-500">
                To account for loading and transit time, Mandi appointment slots start from 09:30 AM onwards.
              </p>
            </div>

            {/* Date Picker Bar */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
              {daysList.map((d) => {
                const dayBooked = getBookedSlotsForDate(d, selectedCentre?.id || 'cen-03');
                const availableCount = timeSlotsVehicle.filter(s => !dayBooked.includes(s)).length;
                const isSelected = selectedDate === d;
                const dateObj = new Date(d + 'T00:00:00');

                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`p-3 rounded-2xl border text-center text-xs shrink-0 min-w-[110px] transition-all relative cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-lg ring-2 ring-blue-600/30'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white shadow-sm'
                    }`}
                  >
                    <span className="block text-[10px] uppercase tracking-wider font-semibold opacity-80">
                      {dateObj.toLocaleDateString('en-IN', { weekday: 'short', month: 'short' })}
                    </span>
                    <span className="font-black text-lg my-0.5 block">
                      {dateObj.getDate()}
                    </span>
                    <span
                      className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : availableCount <= 4
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {availableCount} {t('procurement.available', 'Slots')}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filtered Slots */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-800">
                  {t('procurement.selectTimeSlot', 'Select 30-Minute Weighing Slot')} ({new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}):
                </span>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    🟢 {timeSlotsVehicle.filter(s => !getBookedSlotsForDate(selectedDate, selectedCentre?.id || 'cen-03').includes(s)).length} Available
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    🔴 {timeSlotsVehicle.filter(s => getBookedSlotsForDate(selectedDate, selectedCentre?.id || 'cen-03').includes(s)).length} Booked
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {timeSlotsVehicle.map((slot, idx) => {
                  const bookedOnThisDate = getBookedSlotsForDate(selectedDate, selectedCentre?.id || 'cen-03');
                  const isBooked = bookedOnThisDate.includes(slot);
                  const isSelected = selectedSlot === slot;

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-2xl border text-center font-semibold transition-all ${
                        isBooked
                          ? 'bg-rose-50/70 border-rose-200 text-rose-400 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md ring-2 ring-blue-600/30'
                          : 'border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-950 cursor-pointer'
                      }`}
                    >
                      <span className="font-bold">{slot}</span>
                      <span className="block text-[9px] mt-0.5 font-bold">
                        {isBooked ? '⛔ Booked' : isSelected ? '✓ Selected' : '🟢 Available'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(42)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> {t('procurement.previousStep', 'Back')}
              </button>
              <button
                onClick={handleConfirmVehicleSlot}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('procurement.confirmBooking', 'Confirm & Generate Official Token')}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Confirmation Screen */}
        {currentStep === 6 && generatedToken && (
          <div className="text-center py-6 space-y-6 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div>
              <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest">
                {t('procurement.tokenGenerated', 'Official Gate Pass Token Generated!')}
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
                {t('procurement.tokenNumber', 'Token #')}{generatedToken.token_number} ({generatedToken.token_code})
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {selectedCentre.name} • {selectedDate} at {selectedSlot}
              </p>
            </div>

            {/* Summary Details Card */}
            <div className="max-w-md mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('slots.mode', 'Transport Mode')}:</span>
                <span className="font-bold text-slate-900 capitalize">
                  {transportMode === 'vehicle' ? t('slots.govtVehicle', 'Government Vehicle Pickup') : t('slots.selfTransport', 'Self Transport')}
                </span>
              </div>
              {transportMode === 'vehicle' && assignedDriver && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('tracking.driver', 'Driver')}:</span>
                    <span className="font-bold text-slate-900">{assignedDriver.driver_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Driver Phone:</span>
                    <span className="font-bold text-slate-900">{assignedDriver.driver_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('transport.pickupTime', 'Scheduled Pickup Time')}:</span>
                    <span className="font-bold text-slate-900">{preferredPickupTime}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">{t('crops.cropType', 'Crop Type')}:</span>
                <span className="font-bold text-slate-900">{cropType} ({cropQuantityKg} kg)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SMS Notifications:</span>
                <span className="font-bold text-emerald-600">Dispatched via MSG91 ✓</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-5 py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                <FileDown className="w-4 h-4" />
                {t('procurement.downloadPdf', 'Download Official PDF Token')}
              </button>

              {transportMode === 'vehicle' ? (
                <button
                  onClick={() => navigate('/farmer/vehicle-tracking')}
                  className="flex items-center gap-1.5 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  {t('procurement.trackDriver', 'Track Assigned Vehicle Live')}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/farmer/transport')}
                  className="flex items-center gap-1.5 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  {t('centres.getDirections', 'Get Directions')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
