// 8-Step Offline Farmer Assistance Wizard for Society Officers
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState } from 'react';
import { 
  Search, UserPlus, Sprout, MapPin, Truck, Calendar, Printer, 
  CheckCircle, ArrowRight, ArrowLeft, Phone, X, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { db, ProcurementCentre, Farmer, Vehicle, OfflineFarmer } from '../../lib/db';
import { generateTokenPdf } from '../../lib/pdf';
import { sendSms } from '../../lib/sms';

interface OfflineFarmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OfflineFarmerModal: React.FC<OfflineFarmerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Farmer[]>([]);
  const [step3Error, setStep3Error] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    farmer_name: 'Baidhar Mallik',
    father_husband_name: 'Bhima Mallik',
    aadhaar_masked: 'XXXX-XXXX-7721',
    village: 'Nuapali Basti',
    district: 'Sambalpur',
    block: 'Maneswar',
    mobile_optional: '',
    alternate_contact_name: 'Pradeep Mallik (Son)',
    alternate_contact_phone: '+919876541122',
    land_area_hectares: 2.1,
    bank_account_encrypted: '9872138912',
    ifsc_code: 'SBIN0000178',
    crop_type: 'Paddy (Common)',
    expected_quantity_kg: 2100,
    harvest_date: new Date().toISOString().split('T')[0],
    centre_id: 'cen-03',
    transport_choice: 'self' as 'self' | 'vehicle',
    pickup_location: 'Nuapali Basti Village Square',
    pickup_latitude: 21.4680,
    pickup_longitude: 83.9780,
    preferred_pickup_time: '07:30 AM',
    special_instructions: 'Keep bags stacked near school field',
    slot_id: 'slot-102',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time_slot: '10:00 AM - 10:30 AM',
  });

  const [assignedDriver, setAssignedDriver] = useState<Vehicle | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string>('KFA-OF-1042');
  const [generatedNumber, setGeneratedNumber] = useState<number>(1042);
  const [isAssigningVehicle, setIsAssigningVehicle] = useState(false);

  if (!isOpen) return null;

  const centres = db.getCollection<ProcurementCentre>('centres');
  const selectedCentre = centres.find((c) => c.id === formData.centre_id) || centres[0];

  // Step 1: Search
  const handleSearch = () => {
    const farmers = db.getCollection<Farmer>('farmers');
    const q = searchQuery.toLowerCase();
    const results = farmers.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.village.toLowerCase().includes(q) ||
        f.aadhaar_masked.includes(q)
    );
    setSearchResults(results);
  };

  const handleSelectExistingFarmer = (f: Farmer) => {
    setFormData((prev) => ({
      ...prev,
      farmer_name: f.name,
      father_husband_name: f.father_husband_name || '',
      aadhaar_masked: f.aadhaar_masked,
      village: f.village,
      district: f.district,
      block: f.block || '',
      alternate_contact_name: f.alternate_contact_name || 'Family Member',
      alternate_contact_phone: f.alternate_contact_phone || '+919876541122',
      land_area_hectares: f.land_area_hectares,
      ifsc_code: f.ifsc_code,
    }));
    // Skip to Step 3
    setCurrentStep(3);
  };

  // Step 5: Vehicle Assignment Logic
  const handleRequestVehicle = () => {
    setIsAssigningVehicle(true);
    setTimeout(() => {
      const vehicles = db.getCollection<Vehicle>('vehicles');
      const found = vehicles.find((v) => v.status === 'available') || vehicles[0];
      setAssignedDriver(found);
      setIsAssigningVehicle(false);

      // Trigger SMS to alternate contact
      sendSms({
        phone: formData.alternate_contact_phone,
        message: `Vehicle assigned for Farmer ${formData.farmer_name}. Driver: ${found.driver_name}, ${found.driver_phone}. Scheduled pickup: ${formData.preferred_pickup_time}.`,
        type: 'transactional',
      });
    }, 1000);
  };

  // Confirm booking & print
  const handleConfirmAndPrint = () => {
    const offlineRecord = db.createOfflineFarmer({
      society_officer_id: 'usr-society',
      farmer_name: formData.farmer_name,
      father_husband_name: formData.father_husband_name,
      aadhaar_masked: formData.aadhaar_masked,
      village: formData.village,
      district: formData.district,
      block: formData.block,
      mobile_optional: formData.mobile_optional,
      alternate_contact_name: formData.alternate_contact_name,
      alternate_contact_phone: formData.alternate_contact_phone,
      land_area_hectares: formData.land_area_hectares,
      ifsc_code: formData.ifsc_code,
      crop_type: formData.crop_type,
      expected_quantity_kg: formData.expected_quantity_kg,
      harvest_date: formData.harvest_date,
      centre_id: formData.centre_id,
      transport_choice: formData.transport_choice,
      assigned_vehicle_id: assignedDriver?.id,
      pickup_location: formData.pickup_location,
      pickup_latitude: formData.pickup_latitude,
      pickup_longitude: formData.pickup_longitude,
      preferred_pickup_time: formData.preferred_pickup_time,
      special_instructions: formData.special_instructions,
      slot_id: formData.slot_id,
      token_number: generatedNumber,
      token_code: generatedToken,
      status: formData.transport_choice === 'vehicle' ? 'vehicle_assigned' : 'slot_booked',
    });

    setGeneratedToken(offlineRecord.token_code || 'KFA-OF-1042');
    setGeneratedNumber(offlineRecord.token_number || 1042);

    // Print PDF
    generateTokenPdf({
      tokenCode: offlineRecord.token_code || 'KFA-OF-1042',
      tokenNumber: offlineRecord.token_number || 1042,
      farmerName: formData.farmer_name,
      farmerPhone: formData.alternate_contact_phone,
      village: formData.village,
      district: formData.district,
      cropType: formData.crop_type,
      cropQuantityKg: formData.expected_quantity_kg,
      centreName: selectedCentre.name,
      centreAddress: selectedCentre.address,
      date: formData.date,
      timeSlot: formData.time_slot,
      transportMode: formData.transport_choice,
      driverName: assignedDriver?.driver_name,
      driverPhone: assignedDriver?.driver_phone,
      pickupTime: formData.preferred_pickup_time,
      isOfflineFarmer: true,
    });

    setCurrentStep(6);
  };

  const stepsList = [
    'Search Farmer',
    'Offline Profile',
    'Crop & Qty',
    'Select Centre',
    'Transport & Slot',
    'Confirmation',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-800 text-white p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-700/80 border border-emerald-500/40">
              PACS Assisted Mode
            </span>
            <h3 className="font-extrabold text-lg sm:text-xl flex items-center gap-2 mt-1">
              📵 Offline Farmer Inclusivity Wizard
            </h3>
            <p className="text-xs text-emerald-100">
              Assisting non-smartphone farmers with official token generation & SMS alerts
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between overflow-x-auto gap-2 text-xs">
          {stepsList.map((step, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep === stepNum;
            const isDone = currentStep > stepNum;
            return (
              <div
                key={idx}
                className={`flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'font-bold text-emerald-700'
                    : isDone
                    ? 'text-slate-500'
                    : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? '✓' : stepNum}
                </span>
                <span className="hidden sm:inline">{step}</span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* STEP 1: Search Existing Farmer */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-600" />
                Step 1: Check If Farmer Exists in Database
              </h4>
              <p className="text-xs text-slate-500">
                Search by Farmer Name, Aadhaar Number (last 4 digits), or Village name.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter name, Aadhaar or village..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                >
                  Search
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-3 divide-y divide-slate-100 bg-slate-50">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                    Found {searchResults.length} Match(es):
                  </span>
                  {searchResults.map((f) => (
                    <div
                      key={f.id}
                      className="py-2 flex items-center justify-between hover:bg-white p-2 rounded-lg"
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-900">{f.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {f.village}, {f.district} • Aadhaar: {f.aadhaar_masked}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSelectExistingFarmer(f)}
                        className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg font-semibold"
                      >
                        Select & Continue →
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Farmer not found in system?</span>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Create New Offline Farmer Record
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Create Offline Farmer Record */}
          {currentStep === 2 && (
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                Step 2: Enter Offline Farmer Demographics & Bank Info
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Farmer Full Name *</label>
                  <input
                    type="text"
                    value={formData.farmer_name}
                    onChange={(e) => setFormData({ ...formData, farmer_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Father / Husband Name *</label>
                  <input
                    type="text"
                    value={formData.father_husband_name}
                    onChange={(e) => setFormData({ ...formData, father_husband_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Aadhaar (Masked) *</label>
                  <input
                    type="text"
                    value={formData.aadhaar_masked}
                    onChange={(e) => setFormData({ ...formData, aadhaar_masked: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Village Name *</label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Alternate Contact Name (Family) *</label>
                  <input
                    type="text"
                    value={formData.alternate_contact_name}
                    onChange={(e) => setFormData({ ...formData, alternate_contact_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Alternate Contact Phone (SMS) *</label>
                  <input
                    type="text"
                    value={formData.alternate_contact_phone}
                    onChange={(e) => setFormData({ ...formData, alternate_contact_phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bank Account Number *</label>
                  <input
                    type="text"
                    value={formData.bank_account_encrypted}
                    onChange={(e) => setFormData({ ...formData, bank_account_encrypted: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bank IFSC Code *</label>
                  <input
                    type="text"
                    value={formData.ifsc_code}
                    onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Crop Details */}
          {currentStep === 3 && (
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-600" />
                Step 3: Enter Crop & Estimated Harvest Quantity
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Select Crop *</label>
                  <select
                    value={formData.crop_type}
                    onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Paddy (Common)">Paddy (Common) - MSP ₹ 2,300/Q</option>
                    <option value="Paddy (Grade A)">Paddy (Grade A) - MSP ₹ 2,320/Q</option>
                    <option value="Wheat (Sharbati)">Wheat (Sharbati) - MSP ₹ 2,425/Q</option>
                    <option value="Maize">Maize - MSP ₹ 2,225/Q</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 block">Expected Crop Quantity (kg) *</label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Max: 100 Q (10,000 kg)
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={formData.expected_quantity_kg || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormData({ ...formData, expected_quantity_kg: val });
                      if (val > 10000) {
                        setStep3Error('Maximum crop weight limit is 100 Quintals (10,000 kg). Cannot exceed 100 Quintals.');
                      } else if (val <= 0) {
                        setStep3Error('Please enter a valid positive crop quantity.');
                      } else {
                        setStep3Error('');
                      }
                    }}
                    className={`w-full border rounded-lg p-2 focus:ring-2 outline-none font-bold ${
                      formData.expected_quantity_kg > 10000 ? 'border-rose-500 bg-rose-50/40 text-rose-900 focus:ring-rose-500' : 'border-slate-300 focus:ring-emerald-500'
                    }`}
                    placeholder="Enter quantity in kg (Max 10000)"
                  />
                  <div className="flex items-center justify-between text-[11px] mt-1">
                    <span className={`font-semibold ${formData.expected_quantity_kg > 10000 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                      = {(Number(formData.expected_quantity_kg || 0) / 100).toFixed(2)} Quintals
                    </span>
                    <span className={formData.expected_quantity_kg > 10000 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                      {formData.expected_quantity_kg > 10000 ? '⚠️ Exceeds State Quota Limit' : `Quota usage: ${Math.min(100, Math.round((formData.expected_quantity_kg / 10000) * 100))}%`}
                    </span>
                  </div>

                  {step3Error && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-1.5 mt-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{step3Error}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estimated Harvest Date *</label>
                  <input
                    type="date"
                    value={formData.harvest_date}
                    onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Select Procurement Centre */}
          {currentStep === 4 && (
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Step 4: Select Target Mandi / Procurement Centre
              </h4>

              <div className="space-y-2">
                {centres.map((centre) => (
                  <div
                    key={centre.id}
                    onClick={() => setFormData({ ...formData, centre_id: centre.id })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      formData.centre_id === centre.id
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900">{centre.name}</p>
                      <p className="text-[11px] text-slate-500">{centre.address}</p>
                      <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        Queue: {centre.queue_length} farmers • Wait: ~{centre.avg_wait_time_minutes} mins
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">
                      {formData.centre_id === centre.id ? '✓ Selected' : 'Select'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Transport Choice & Slot Booking */}
          {currentStep === 5 && (
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                Step 5: Transport Selection & Slot Allocation
              </h4>

              {/* Radio options */}
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`p-3.5 rounded-xl border cursor-pointer flex flex-col items-center text-center gap-1.5 transition-all ${
                    formData.transport_choice === 'self'
                      ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="transport_choice"
                    value="self"
                    checked={formData.transport_choice === 'self'}
                    onChange={() => setFormData({ ...formData, transport_choice: 'self' })}
                    className="sr-only"
                  />
                  <span className="text-xl">🚜</span>
                  <span className="font-bold text-slate-900">Self Transport</span>
                  <span className="text-[10px] text-slate-500">Farmer will bring crop to mandi</span>
                </label>

                <label
                  className={`p-3.5 rounded-xl border cursor-pointer flex flex-col items-center text-center gap-1.5 transition-all ${
                    formData.transport_choice === 'vehicle'
                      ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="transport_choice"
                    value="vehicle"
                    checked={formData.transport_choice === 'vehicle'}
                    onChange={() => setFormData({ ...formData, transport_choice: 'vehicle' })}
                    className="sr-only"
                  />
                  <span className="text-xl">🚚</span>
                  <span className="font-bold text-slate-900">Request Vehicle</span>
                  <span className="text-[10px] text-slate-500">Free government pickup trolley</span>
                </label>
              </div>

              {/* If Vehicle selected: Vehicle Request & Driver Match */}
              {formData.transport_choice === 'vehicle' && (
                <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 space-y-3">
                  <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                    Vehicle Pickup Logistics Form
                  </span>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Pickup Village & Landmark *</label>
                    <input
                      type="text"
                      value={formData.pickup_location}
                      onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Preferred Pickup Time *</label>
                    <select
                      value={formData.preferred_pickup_time}
                      onChange={(e) => setFormData({ ...formData, preferred_pickup_time: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none"
                    >
                      <option value="07:00 AM">07:00 AM - Early Morning</option>
                      <option value="07:30 AM">07:30 AM - Recommended</option>
                      <option value="08:00 AM">08:00 AM - Morning</option>
                    </select>
                  </div>

                  {!assignedDriver ? (
                    <button
                      onClick={handleRequestVehicle}
                      disabled={isAssigningVehicle}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Truck className="w-4 h-4" />
                      {isAssigningVehicle ? 'Matching Nearest Vehicle via Haversine...' : 'Trigger Smart Vehicle Assignment'}
                    </button>
                  ) : (
                    <div className="p-2.5 bg-white rounded-lg border border-blue-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">
                          Assigned: {assignedDriver.driver_name} ({assignedDriver.registration_number})
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {assignedDriver.vehicle_type} • Phone: {assignedDriver.driver_phone}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                        Vehicle Assigned ✓
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Slot Grid Selection */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">
                  Select Procurement Slot (Appointment) *
                  {formData.transport_choice === 'vehicle' && ' (Locked to ≥ 2 hours post-pickup)'}
                </span>

                <div className="grid grid-cols-3 gap-2">
                  {['09:30 AM - 10:00 AM', '10:00 AM - 10:30 AM', '11:00 AM - 11:30 AM', '02:00 PM - 02:30 PM', '03:00 PM - 03:30 PM', '04:00 PM - 04:30 PM'].map((slot, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, time_slot: slot })}
                      className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                        formData.time_slot === slot
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Confirmation & Print */}
          {currentStep === 6 && (
            <div className="space-y-4 text-center py-4 animate-scale-in">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                  Success • Slot Booked & Confirmed
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  TOKEN: {generatedToken}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Queue Sequence #{generatedNumber} at {selectedCentre.name}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs max-w-md mx-auto space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Farmer:</span>
                  <span className="font-bold text-slate-800">{formData.farmer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Crop & Weight:</span>
                  <span className="font-bold text-slate-800">{formData.crop_type} ({formData.expected_quantity_kg} kg)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Slot:</span>
                  <span className="font-bold text-slate-800">{formData.date} • {formData.time_slot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transport:</span>
                  <span className="font-bold text-emerald-700 capitalize">
                    {formData.transport_choice === 'vehicle' ? `Vehicle (${assignedDriver?.driver_name})` : 'Self Transport'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SMS Sent To:</span>
                  <span className="font-bold text-slate-800">{formData.alternate_contact_phone}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() =>
                    generateTokenPdf({
                      tokenCode: generatedToken,
                      tokenNumber: generatedNumber,
                      farmerName: formData.farmer_name,
                      farmerPhone: formData.alternate_contact_phone,
                      village: formData.village,
                      district: formData.district,
                      cropType: formData.crop_type,
                      cropQuantityKg: formData.expected_quantity_kg,
                      centreName: selectedCentre.name,
                      centreAddress: selectedCentre.address,
                      date: formData.date,
                      timeSlot: formData.time_slot,
                      transportMode: formData.transport_choice,
                      driverName: assignedDriver?.driver_name,
                      driverPhone: assignedDriver?.driver_phone,
                      pickupTime: formData.preferred_pickup_time,
                      isOfflineFarmer: true,
                    })
                  }
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Print Token Slip (PDF)
                </button>

                <button
                  onClick={() => {
                    onClose();
                    if (onSuccess) onSuccess();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all"
                >
                  Done & Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {currentStep < 6 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="flex items-center gap-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                onClick={() => {
                  if (currentStep === 3) {
                    const qty = Number(formData.expected_quantity_kg);
                    if (!qty || qty <= 0) {
                      setStep3Error('Please enter a valid positive crop quantity.');
                      return;
                    }
                    if (qty > 10000) {
                      setStep3Error('Maximum crop weight limit is 100 Quintals (10,000 kg). Cannot exceed 100 Quintals.');
                      return;
                    }
                  }
                  setStep3Error('');
                  setCurrentStep((prev) => prev + 1);
                }}
                disabled={currentStep === 3 && (formData.expected_quantity_kg > 10000 || formData.expected_quantity_kg <= 0)}
                className={`flex items-center gap-1 px-4 py-2 font-bold rounded-xl shadow-sm transition-colors text-xs ${
                  currentStep === 3 && (formData.expected_quantity_kg > 10000 || formData.expected_quantity_kg <= 0)
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                Save & Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleConfirmAndPrint}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm & Generate Slip
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
