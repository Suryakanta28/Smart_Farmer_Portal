// Fleet Driver Official Profile & Commercial Vehicle Logistics Page
// FPP - Smart Farmer Procurement Platform

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Truck, ShieldCheck, MapPin, Phone, Mail, CreditCard, 
  Edit3, Save, X, Camera, CheckCircle2, AlertCircle, 
  Navigation, RefreshCw, Award, Gauge, FileText, Calendar,
  Shield, KeyRound, Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, Vehicle, User } from '../../lib/db';

export const DriverProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load driver's assigned vehicle from db
  const [vehicle, setVehicle] = useState<Vehicle>(() => {
    const vehicles = db.getCollection<Vehicle>('vehicles');
    return vehicles[0] || {
      id: 'veh-01',
      registration_number: 'OD-15-AB-1024',
      vehicle_type: 'Mini Truck (1.5T)',
      capacity_kg: 1500,
      driver_name: user?.name || 'Suresh Kumar Mohapatra',
      driver_phone: user?.phone || '+919876543210',
      status: 'available',
      latitude: 21.4680,
      longitude: 83.9780,
      last_gps_update: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || 'Suresh Kumar Mohapatra',
    email: user?.email || 'driver@krishiflow.ai',
    phone: user?.phone || '+91 98765 43210',
    avatar_url: user?.avatar_url || '',
    driving_license_no: 'OD-15-2018-DL-98214',
    license_expiry: '2031-10-15',
    aadhaar_masked: 'XXXX-XXXX-4198',
    assigned_vehicle_reg: vehicle.registration_number || 'OD-15-AB-1024',
    vehicle_type: vehicle.vehicle_type || 'Mini Truck (1.5T)',
    payload_capacity_kg: vehicle.capacity_kg || 1500,
    mandi_base: 'Sambalpur Regulated Market Yard (PC-SBP-03)',
    home_location: 'Dhanupali, Sambalpur, Odisha',
    emergency_contact_name: 'Manas Mohapatra (Brother)',
    emergency_contact_phone: '+91 98765 43299',
    blood_group: 'O+',
    experience_years: '8 Years Commercial Fleet',
    permit_validity: 'National Transport Permit (Valid till 2028)',
    insurance_policy: 'National Insurance Commercial #NIC-OD-90214',
    latitude: vehicle.latitude || 21.4680,
    longitude: vehicle.longitude || 83.9780,
  });

  // Subscribe to vehicle updates
  useEffect(() => {
    const refreshData = () => {
      const vehicles = db.getCollection<Vehicle>('vehicles');
      const v = vehicles[0];
      if (v) {
        setVehicle(v);
        if (!isEditing) {
          setFormData((prev) => ({
            ...prev,
            assigned_vehicle_reg: v.registration_number,
            vehicle_type: v.vehicle_type,
            payload_capacity_kg: v.capacity_kg,
            latitude: v.latitude,
            longitude: v.longitude,
          }));
        }
      }
    };

    const unsub = db.subscribe('table:vehicles', refreshData);
    return () => unsub();
  }, [isEditing]);

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveError(t('driverProfile.errorValidImage', 'Please select a valid image file (JPG, PNG, WebP).'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveError(t('driverProfile.errorImageSize', 'Image file size should be less than 5MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      setFormData((prev) => ({ ...prev, avatar_url: base64Url }));
      setSaveError('');
    };
    reader.readAsDataURL(file);
  };

  // Sample Avatar Presets
  const avatarPresets = [
    { label: 'Avatar 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { label: 'Avatar 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { label: 'Avatar 3', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { label: 'Avatar 4', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80' },
  ];

  // GPS Auto-detect
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setSaveError(t('driverProfile.errorGeoNotSupported', 'Geolocation is not supported by your browser.'));
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(4));
        const lng = Number(position.coords.longitude.toFixed(4));
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setDetectingGps(false);
      },
      (error) => {
        setSaveError(`GPS Detection error: ${error.message}`);
        setDetectingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Save Profile Form
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');

    if (!formData.name.trim()) {
      setSaveError(t('driverProfile.errorNameRequired', 'Driver name is required.'));
      return;
    }
    if (!formData.phone.trim()) {
      setSaveError(t('driverProfile.errorPhoneRequired', 'Contact phone number is required.'));
      return;
    }

    // Update global Auth User context
    if (updateUser) {
      updateUser({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        avatar_url: formData.avatar_url,
      });
    }

    // Update vehicles table in db
    const vehicles = db.getCollection<Vehicle>('vehicles');
    const updatedVehicles = vehicles.map((v) => {
      if (v.id === vehicle.id) {
        return {
          ...v,
          registration_number: formData.assigned_vehicle_reg,
          vehicle_type: formData.vehicle_type,
          capacity_kg: Number(formData.payload_capacity_kg),
          driver_name: formData.name,
          driver_phone: formData.phone,
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          last_gps_update: new Date().toISOString(),
        };
      }
      return v;
    });
    db.setCollection('vehicles', updatedVehicles);

    // Save to users table in db
    const users = db.getCollection<User>('users');
    const updatedUsers = users.map((u) => {
      if (u.id === user?.id || u.role === 'driver') {
        return {
          ...u,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          avatar_url: formData.avatar_url,
        };
      }
      return u;
    });
    db.setCollection('users', updatedUsers);

    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      {/* Toast Alert */}
      {saveSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{t('driverProfile.updatedToast', 'Driver official profile updated & synced successfully!')}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Truck className="w-6 h-6 text-amber-500" />
              <span>{t('driverProfile.title', 'Driver Official Profile')}</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
              {t('driverProfile.badgeVerified', 'FLEET VERIFIED')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('driverProfile.subtitle', 'Official Commercial Vehicle Operator ID • Ministry of Road Transport & State Agriculture Logistics Grid')}
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>{t('driverProfile.editBtn', 'Edit Profile Details')}</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setIsEditing(false);
              setSaveError('');
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>{t('driverProfile.cancelBtn', 'Cancel Editing')}</span>
          </button>
        )}
      </div>

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-50 rounded-bl-full pointer-events-none -z-0" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Avatar Profile Picture */}
            <div className="relative group">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt={formData.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-amber-400 shadow-lg shadow-amber-500/20"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-4xl shadow-lg shadow-amber-500/20 border-4 border-amber-300">
                  {formData.name.charAt(0) || 'D'}
                </div>
              )}

              {isEditing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2 bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 transition-transform hover:scale-105 cursor-pointer"
                  title="Upload Driver Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {formData.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {t('driverProfile.licenseActive', 'Commercial License Active')}
                </span>
              </div>

              <p className="text-xs text-slate-500 font-medium">
                {t('driverProfile.badge', 'Driver Badge:')} <b className="text-slate-800 font-mono">FPP-FLEET-2026-DRV</b> • {t('driverProfile.status', 'Status:')} <b className="text-emerald-600">{t('driverProfile.onlineGps', 'Online on GPS')}</b>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-600">
                <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl font-semibold">
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  {formData.assigned_vehicle_reg} ({formData.vehicle_type})
                </span>
                <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {formData.home_location}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 w-full sm:w-auto text-center sm:text-right space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t('driverProfile.fleetRatingTitle', 'Fleet Rating & On-Time Pickups')}
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 block">
              ⭐ 4.9 <span className="text-xs text-slate-500 font-medium">{t('driverProfile.tripsCount', '/ 5.0 (84 Trips)')}</span>
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block">
              {t('driverProfile.mandiAdherence', '98.2% Mandi Slot Adherence')}
            </span>
          </div>
        </div>

        {/* Preset Photo Selector when editing */}
        {isEditing && (
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">{t('driverProfile.fastAvatar', 'Choose Fast Avatar Preset:')}</span>
            <div className="flex flex-wrap gap-2.5">
              {avatarPresets.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, avatar_url: preset.url }))}
                  className="p-1 rounded-2xl border-2 border-slate-200 hover:border-amber-500 transition-colors cursor-pointer"
                >
                  <img src={preset.url} alt={preset.label} className="w-10 h-10 rounded-xl object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* SECTION 1: COMMERCIAL VEHICLE & FLEET SPECIFICATIONS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {t('driverProfile.sec1Title', 'Commercial Vehicle & Fleet Assignment')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('driverProfile.sec1Subtitle', 'Logistics tractor/truck specs, registration numbers, and assigned mandi yard')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.assignedVehicleReg', 'Assigned Vehicle Reg No *')}
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.assigned_vehicle_reg}
                onChange={(e) => setFormData({ ...formData, assigned_vehicle_reg: e.target.value })}
                className="w-full font-mono font-bold p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.vehicleType', 'Vehicle Type *')}
              </label>
              <select
                disabled={!isEditing}
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="w-full font-bold p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Mini Truck (1.5T)">Mini Truck (1.5T)</option>
                <option value="Tractor Trolley (3.5T)">Tractor Trolley (3.5T)</option>
                <option value="Medium Truck (5.0T)">Medium Truck (5.0T)</option>
                <option value="Tata Ace (1.2T)">Tata Ace (1.2T)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.payloadCapacity', 'Payload Capacity (Kg) *')}
              </label>
              <input
                type="number"
                disabled={!isEditing}
                value={formData.payload_capacity_kg}
                onChange={(e) => setFormData({ ...formData, payload_capacity_kg: Number(e.target.value) })}
                className="w-full font-bold p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.assignedBaseMandi', 'Assigned Base Mandi / Procurement Yard')}
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.mandi_base}
                onChange={(e) => setFormData({ ...formData, mandi_base: e.target.value })}
                className="w-full font-bold p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.permitValidity', 'Commercial Permit Validity')}
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.permit_validity}
                onChange={(e) => setFormData({ ...formData, permit_validity: e.target.value })}
                className="w-full font-medium p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: DRIVER IDENTIFICATION & LICENSE CREDENTIALS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {t('driverProfile.sec2Title', 'Driver Identification & Commercial License')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('driverProfile.sec2Subtitle', 'Official RTO driving license, masked Aadhaar ID, and verification status')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.driverFullName', 'Driver Full Name *')}
              </label>
              <input
                type="text"
                required
                disabled={!isEditing}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full font-bold p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.licenseNo', 'Commercial Driving License No *')}
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.driving_license_no}
                onChange={(e) => setFormData({ ...formData, driving_license_no: e.target.value })}
                className="w-full font-mono font-bold p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.licenseExpiry', 'License Expiry Date')}
              </label>
              <input
                type="date"
                disabled={!isEditing}
                value={formData.license_expiry}
                onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                className="w-full font-bold p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.aadhaarMasked', 'Aadhaar (Masked)')}
              </label>
              <input
                type="text"
                disabled={true}
                value={formData.aadhaar_masked}
                className="w-full font-mono font-bold p-3 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl cursor-not-allowed"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.bloodGroup', 'Blood Group')}
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                className="w-full font-bold p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.drivingExp', 'Commercial Driving Experience')}
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                className="w-full font-bold p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: CONTACT & EMERGENCY DETAILS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {t('driverProfile.sec3Title', 'Contact & Emergency Response Info')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('driverProfile.sec3Subtitle', 'Active contact details used for farmer calls and logistics dispatch control')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.mobileNumber', 'Mobile Number (Calls & SMS) *')}
              </label>
              <input
                type="text"
                required
                disabled={!isEditing}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full font-bold p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.emailAddress', 'Email Address')}
              </label>
              <input
                type="email"
                disabled={!isEditing}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full font-bold p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.homeAddress', 'Home Address')}
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.home_location}
                onChange={(e) => setFormData({ ...formData, home_location: e.target.value })}
                className="w-full font-bold p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.emergencyContactName', 'Emergency Contact Name')}
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                className="w-full font-bold p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.emergencyContactPhone', 'Emergency Contact Phone')}
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                className="w-full font-bold p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: REAL-TIME GPS HOME POSITION */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {t('driverProfile.sec4Title', 'Default GPS Dispatch Coordinates')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('driverProfile.sec4Subtitle', 'Used by Haversine dispatch algorithm to match nearest available farmer pickups')}
                </p>
              </div>
            </div>

            {isEditing && (
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={detectingGps}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-colors cursor-pointer"
              >
                <Radio className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
                <span>{detectingGps ? t('driverProfile.detecting', 'Detecting...') : t('driverProfile.autoDetectGps', 'Auto-Detect GPS')}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.latitude', 'Latitude (° N)')}
              </label>
              <input
                type="number"
                step="0.0001"
                disabled={!isEditing}
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                className="w-full font-mono font-bold p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t('driverProfile.longitude', 'Longitude (° E)')}
              </label>
              <input
                type="number"
                step="0.0001"
                disabled={!isEditing}
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                className="w-full font-mono font-bold p-3 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button Bar */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              {t('driverProfile.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t('driverProfile.saveProfile', 'Save Driver Profile')}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
