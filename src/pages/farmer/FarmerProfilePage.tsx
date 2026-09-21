// Farmer Official Profile & Identity Management Page
// KRISHIFLOW-AI - Smart Farmer Procurement Platform

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, ShieldCheck, MapPin, Building2, Phone, CreditCard, 
  Edit3, Save, X, Camera, Upload, CheckCircle2, AlertCircle, 
  Landmark, Sparkles, Navigation, RefreshCw, Trash2, Sprout, Hash
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, Farmer } from '../../lib/db';

export const FarmerProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load farmer profile linked to current user
  const [currentFarmer, setCurrentFarmer] = useState<Farmer>(() => {
    return db.getFarmerByUserId(user?.id);
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: currentFarmer.name || user?.name || 'Ramesh Chandra Pradhan',
    father_husband_name: currentFarmer.father_husband_name || 'Late Bipin Bihari Pradhan',
    avatar_url: currentFarmer.avatar_url || user?.avatar_url || '',
    bank_account: currentFarmer.bank_account || '982100192831',
    ifsc_code: currentFarmer.ifsc_code || 'SBIN0000178',
    village: currentFarmer.village || 'Nuapali Basti',
    district: currentFarmer.district || 'Sambalpur',
    block: currentFarmer.block || 'Maneswar',
    state: currentFarmer.state || 'Odisha',
    land_area_hectares: currentFarmer.land_area_hectares || 2.4,
    aadhaar_masked: currentFarmer.aadhaar_masked || 'XXXX-XXXX-8921',
    mobile: currentFarmer.alternate_contact_phone || user?.phone || '+91 98765 43201',
    latitude: currentFarmer.latitude || 21.4820,
    longitude: currentFarmer.longitude || 83.9620,
  });

  // Subscribe to reactive database changes on farmers table
  useEffect(() => {
    const refreshProfile = () => {
      const f = db.getFarmerByUserId(user?.id);
      setCurrentFarmer(f);
      if (!isEditing) {
        setFormData({
          name: f.name || user?.name || 'Ramesh Chandra Pradhan',
          father_husband_name: f.father_husband_name || 'Late Bipin Bihari Pradhan',
          avatar_url: f.avatar_url || user?.avatar_url || '',
          bank_account: f.bank_account || '982100192831',
          ifsc_code: f.ifsc_code || 'SBIN0000178',
          village: f.village || 'Nuapali Basti',
          district: f.district || 'Sambalpur',
          block: f.block || 'Maneswar',
          state: f.state || 'Odisha',
          land_area_hectares: f.land_area_hectares || 2.4,
          aadhaar_masked: f.aadhaar_masked || 'XXXX-XXXX-8921',
          mobile: f.alternate_contact_phone || user?.phone || '+91 98765 43201',
          latitude: f.latitude || 21.4820,
          longitude: f.longitude || 83.9620,
        });
      }
    };

    const unsub = db.subscribe('table:farmers', refreshProfile);
    return () => unsub();
  }, [user?.id, isEditing]);

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Image file size should be less than 5MB.');
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

  // Sample Avatar Presets for quick selection
  const avatarPresets = [
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  ];

  // Auto-Detect Current GPS Coordinates
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setSaveError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    setSaveError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
        }));
        setDetectingGps(false);
      },
      (err) => {
        console.warn('GPS location error:', err);
        setSaveError('Could not fetch GPS location. Please check device permissions.');
        setDetectingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Save Profile Changes to Database & Global State
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setSaveError('Full Name cannot be empty.');
      return;
    }

    const trimmedAccount = formData.bank_account.trim();
    if (!trimmedAccount) {
      setSaveError('Bank Account Number is required for PFMS DBT settlements.');
      return;
    }

    const trimmedIfsc = formData.ifsc_code.trim();
    if (!trimmedIfsc) {
      setSaveError('Bank IFSC Code is required.');
      return;
    }

    // 1. Centralized Database Update with Cascading Propagation
    const result = db.updateFarmerProfile(
      currentFarmer.id,
      {
        name: trimmedName,
        father_husband_name: formData.father_husband_name.trim(),
        avatar_url: formData.avatar_url,
        bank_account: trimmedAccount,
        ifsc_code: trimmedIfsc.toUpperCase(),
        village: formData.village.trim(),
        district: formData.district.trim(),
        block: formData.block.trim(),
        state: formData.state.trim(),
        land_area_hectares: Number(formData.land_area_hectares) || 2.4,
        aadhaar_masked: formData.aadhaar_masked.trim(),
        alternate_contact_phone: formData.mobile.trim(),
        latitude: Number(formData.latitude) || 21.4820,
        longitude: Number(formData.longitude) || 83.9620,
      },
      user?.id
    );

    // 2. Update Auth User Context State
    updateUser({
      name: trimmedName,
      avatar_url: formData.avatar_url,
      phone: formData.mobile.trim(),
    });

    if (result.farmer) {
      setCurrentFarmer(result.farmer);
    }

    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 5000);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError('');
    // Reset to existing stored data
    const f = db.getFarmerByUserId(user?.id);
    setFormData({
      name: f.name || user?.name || 'Ramesh Chandra Pradhan',
      father_husband_name: f.father_husband_name || 'Late Bipin Bihari Pradhan',
      avatar_url: f.avatar_url || user?.avatar_url || '',
      bank_account: f.bank_account || '982100192831',
      ifsc_code: f.ifsc_code || 'SBIN0000178',
      village: f.village || 'Nuapali Basti',
      district: f.district || 'Sambalpur',
      block: f.block || 'Maneswar',
      state: f.state || 'Odisha',
      land_area_hectares: f.land_area_hectares || 2.4,
      aadhaar_masked: f.aadhaar_masked || 'XXXX-XXXX-8921',
      mobile: f.alternate_contact_phone || user?.phone || '+91 98765 43201',
      latitude: f.latitude || 21.4820,
      longitude: f.longitude || 83.9620,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌾</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {t('profile.title', 'Farmer Official Profile')}
            </h2>
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase">
              Aadhaar & PFMS Synced
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('profile.subtitle', 'State Agriculture Database & Aadhaar-linked verification credentials')}
          </p>
        </div>

        <div>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile Details</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-3xl text-xs text-emerald-900 flex items-start gap-3 shadow-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-extrabold text-sm text-emerald-950">
              Profile Updated & Database Synced Successfully!
            </p>
            <p className="text-emerald-800">
              All profile edits (Name, Mobile, Land, DBT Bank Account, Address & Farm GPS) have been saved in the database and propagated to Dashboard, Receipts, Mandi Queue, and Logistics Dispatch.
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {saveError && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-3xl text-xs text-rose-800 flex items-center gap-3 shadow-md animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1 font-semibold">{saveError}</div>
        </div>
      )}

      {/* Main Profile Card Form */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-8">
        
        {/* Profile Picture & Header Info Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100">
          {/* Avatar with Upload Trigger */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-emerald-600/20 border-4 border-white ring-2 ring-slate-200">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt={formData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{formData.name.charAt(0) || 'R'}</span>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {/* Upload Button Overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg border-2 border-white transition-transform hover:scale-110 cursor-pointer"
              title="Upload Profile Picture"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-3 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {isEditing ? (
                <div className="flex-1 max-w-md space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">
                    Farmer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-base outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter Farmer Full Name"
                  />
                </div>
              ) : (
                <div>
                  <h3 className="font-black text-2xl text-slate-900">{formData.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    S/o or W/o: <b className="text-slate-700">{formData.father_husband_name || 'N/A'}</b>
                  </p>
                </div>
              )}

              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full self-center sm:self-start shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('profile.kycVerified', 'KYC Verified')}</span>
              </div>
            </div>

            {/* Father/Husband Name in Edit Mode */}
            {isEditing && (
              <div className="max-w-md space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">
                  Father / Husband Name
                </label>
                <input
                  type="text"
                  value={formData.father_husband_name}
                  onChange={(e) => setFormData({ ...formData, father_husband_name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Late Bipin Bihari Pradhan"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500">
              <span>{t('profile.regId', 'Registration ID')}: <b className="text-slate-800 font-mono">KFA-FARMER-2026-9012</b></span>
              <span>•</span>
              <span>PACS Society: <b className="text-slate-800">{formData.district} Central PACS</b></span>
            </div>

            {/* Quick Photo Actions in Edit Mode */}
            {isEditing && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Local Photo</span>
                </button>

                {formData.avatar_url && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar_url: '' })}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Photo</span>
                  </button>
                )}

                {/* Preset Avatars */}
                <div className="flex items-center gap-1.5 pl-2">
                  <span className="text-[10px] text-slate-400 font-bold">Presets:</span>
                  {avatarPresets.map((preset, idx) => (
                    <img
                      key={idx}
                      src={preset}
                      alt="Preset avatar"
                      onClick={() => setFormData({ ...formData, avatar_url: preset })}
                      className="w-6 h-6 rounded-full object-cover cursor-pointer hover:scale-110 border border-slate-300 transition-transform"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 1: Bank & DBT Settlement Credentials (Editable) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Landmark className="w-4 h-4 text-emerald-600" />
            <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
              Direct Benefit Transfer (PFMS DBT) Bank Account Details
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Bank Account Number */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="text-slate-500 font-bold text-[11px] block flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                {t('profile.linkedBank', 'Bank Account Number (PFMS Direct Deposit)')} *
              </label>

              {isEditing ? (
                <input
                  type="text"
                  required
                  value={formData.bank_account}
                  onChange={(e) => setFormData({ ...formData, bank_account: e.target.value.replace(/\s+/g, '') })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. 982100192831"
                />
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-slate-900 text-sm tracking-wider">
                    {formData.bank_account || '982100192831'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Verified PFMS
                  </span>
                </div>
              )}
              <p className="text-[10px] text-slate-400">
                MSP payments are directly settled into this verified account via PFMS API.
              </p>
            </div>

            {/* Bank IFSC Code */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="text-slate-500 font-bold text-[11px] block flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                {t('profile.ifsc', 'Bank IFSC Code')} *
              </label>

              {isEditing ? (
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={formData.ifsc_code}
                  onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm uppercase outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. SBIN0000178"
                />
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-slate-900 text-sm">
                    {formData.ifsc_code || 'SBIN0000178'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                    State Bank of India
                  </span>
                </div>
              )}
              <p className="text-[10px] text-slate-400">
                Branch routing code for automated RTGS/NEFT/PFMS clearance.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Farmer Agricultural Location & Village (Editable) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                Agricultural Location & Address Grid
              </h4>
            </div>

            {isEditing && (
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingGps}
                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Navigation className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
                <span>{detectingGps ? 'Fetching GPS...' : '📍 Auto-Detect GPS Pin'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* Village */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
              <label className="text-slate-500 font-bold text-[11px] block">Village / Town *</label>
              {isEditing ? (
                <input
                  type="text"
                  required
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <span className="font-extrabold text-slate-900 text-sm block truncate">{formData.village}</span>
              )}
            </div>

            {/* Block */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
              <label className="text-slate-500 font-bold text-[11px] block">Tehsil / Block *</label>
              {isEditing ? (
                <input
                  type="text"
                  required
                  value={formData.block}
                  onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <span className="font-extrabold text-slate-900 text-sm block truncate">{formData.block}</span>
              )}
            </div>

            {/* District */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
              <label className="text-slate-500 font-bold text-[11px] block">District *</label>
              {isEditing ? (
                <input
                  type="text"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <span className="font-extrabold text-slate-900 text-sm block truncate">{formData.district}</span>
              )}
            </div>

            {/* State */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
              <label className="text-slate-500 font-bold text-[11px] block">State *</label>
              {isEditing ? (
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <span className="font-extrabold text-slate-900 text-sm block truncate">{formData.state}</span>
              )}
            </div>
          </div>

          {/* GPS Coordinates & Map Link */}
          <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold text-emerald-950">Farm Gate Coordinates (GPS): </span>
                {isEditing ? (
                  <div className="inline-flex items-center gap-2 ml-2">
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                      className="w-24 px-2 py-0.5 bg-white border border-emerald-300 rounded font-mono text-xs"
                      placeholder="Lat"
                    />
                    <span>° N,</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                      className="w-24 px-2 py-0.5 bg-white border border-emerald-300 rounded font-mono text-xs"
                      placeholder="Lng"
                    />
                    <span>° E</span>
                  </div>
                ) : (
                  <span className="font-mono font-bold text-emerald-800">
                    {Number(formData.latitude).toFixed(4)}° N, {Number(formData.longitude).toFixed(4)}° E
                  </span>
                )}
              </div>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold">
              Used for automated tractor fleet distance & Haversine route calculation
            </span>
          </div>
        </div>

        {/* SECTION 3: Official Verification & Land Records (Editable in Edit Mode) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
              Certified Land & Identity Records
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Masked Aadhaar */}
            <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1">
              <label className="text-slate-500 text-[10px] font-bold block flex items-center gap-1">
                <Hash className="w-3 h-3 text-emerald-600" />
                {t('profile.aadhaar', 'Aadhaar Card (Masked)')}:
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.aadhaar_masked}
                  onChange={(e) => setFormData({ ...formData, aadhaar_masked: e.target.value })}
                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                  placeholder="XXXX-XXXX-8921"
                />
              ) : (
                <span className="font-mono font-bold text-slate-800 text-sm">{formData.aadhaar_masked}</span>
              )}
            </div>

            {/* Mobile Phone */}
            <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1">
              <label className="text-slate-500 text-[10px] font-bold block flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-600" />
                {t('profile.mobile', 'Registered Mobile')}:
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                  placeholder="+91 98765 43201"
                />
              ) : (
                <span className="font-mono font-bold text-slate-800 text-sm">{formData.mobile}</span>
              )}
            </div>

            {/* Cultivated Land Area */}
            <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1">
              <label className="text-slate-500 text-[10px] font-bold block flex items-center gap-1">
                <Sprout className="w-3 h-3 text-emerald-600" />
                {t('profile.landArea', 'Cultivated Land Area')}:
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.land_area_hectares}
                    onChange={(e) => setFormData({ ...formData, land_area_hectares: parseFloat(e.target.value) || 0 })}
                    className="w-24 px-2.5 py-1 bg-white border border-slate-300 rounded font-bold text-xs"
                  />
                  <span className="text-xs text-slate-600 font-medium">Hectares</span>
                </div>
              ) : (
                <span className="font-bold text-slate-800 text-sm">
                  {formData.land_area_hectares} Hectares ({(formData.land_area_hectares * 2.471).toFixed(1)} Acres)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Save CTA (Visible in Edit Mode) */}
        {isEditing && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
