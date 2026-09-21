// 4-Step Farmer Registration Flow with OTP Verification & Custom Password Setup
// FPP - Smart Farmer Procurement Platform

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, ShieldCheck, MapPin, Building2, KeyRound, CheckCircle, 
  ArrowRight, ArrowLeft, Phone, Mail, AlertCircle, Lock, Eye, EyeOff 
} from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import { InteractiveMap } from '../../components/map/InteractiveMap';
import { db, Society, ProcurementCentre, Farmer } from '../../lib/db';
import { sendOtp, resendOtp, verifyOtpBackend, maskPhoneNumber } from '../../lib/otp';

export const RegisterFarmer: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const societies = db.getCollection<Society>('societies');
  const centres = db.getCollection<ProcurementCentre>('centres');

  // Clean Form Fields
  const [formData, setFormData] = useState({
    name: '',
    aadhaar: '',
    village: '',
    district: '',
    block: '',
    state: 'Odisha',
    land_area_hectares: '',
    bank_account: '',
    ifsc: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    society_id: societies[0]?.id || 'soc-03',
    centre_id: centres[0]?.id || 'cen-03',
  });

  // Secure 6-Digit OTP State
  const [otpSessionId, setOtpSessionId] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [sendingOtp, setSendingOtp] = useState<boolean>(false);
  const [verifyingOtp, setVerifyingOtp] = useState<boolean>(false);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string>('');
  const [otpErrorMsg, setOtpErrorMsg] = useState<string>('');
  const [expiresInSeconds, setExpiresInSeconds] = useState<number>(300); // 5 Minutes
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0); // 30s Resend Cooldown
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Clean auto-refresh on mount / navigation
  React.useEffect(() => {
    setStep(1);
    setError('');
    setFormData({
      name: '',
      aadhaar: '',
      village: '',
      district: '',
      block: '',
      state: 'Odisha',
      land_area_hectares: '',
      bank_account: '',
      ifsc: '',
      mobile: '',
      email: '',
      password: '',
      confirmPassword: '',
      society_id: societies[0]?.id || 'soc-03',
      centre_id: centres[0]?.id || 'cen-03',
    });
    setEnteredOtp('');
    setOtpSent(false);
    setOtpSessionId('');
    setOtpSuccessMsg('');
    setOtpErrorMsg('');
  }, []);

  // 5-minute countdown timer
  React.useEffect(() => {
    if (!otpSent || expiresInSeconds <= 0) return;
    const timer = setInterval(() => {
      setExpiresInSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          setOtpErrorMsg('OTP has expired after 5 minutes. Please click Resend OTP.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpSent, expiresInSeconds]);

  // Resend cooldown timer
  React.useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStep1Next = () => {
    setError('');
    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    const cleanPhone = formData.mobile.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Uniqueness Check: Check if mobile number is already registered across any role
    const phoneCheck = db.isPhoneRegistered(formData.mobile);
    if (phoneCheck.registered) {
      setError(phoneCheck.message || 'This mobile number is already registered.');
      return;
    }

    if (!formData.password) {
      setError('Please create a personal password for your account.');
      return;
    }
    if (formData.password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Password and Confirm Password do not match. Please enter the same password in both fields.');
      return;
    }
    setStep(2);
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    setError('');
    setOtpErrorMsg('');
    setIsExpired(false);
    
    // Uniqueness Check: Check if mobile number is already registered across any role
    const phoneCheck = db.isPhoneRegistered(formData.mobile);
    if (phoneCheck.registered) {
      setOtpErrorMsg(phoneCheck.message || 'This mobile number is already registered.');
      setSendingOtp(false);
      return;
    }

    try {
      const res = await sendOtp(formData.mobile, 'Farmer');
      if (res.success && res.sessionId) {
        setOtpSessionId(res.sessionId);
        setOtpSent(true);
        setOtpSuccessMsg(res.message);
        setExpiresInSeconds(res.expiresInSeconds || 300);
        setCooldownSeconds(res.cooldownSeconds || 30);
        setEnteredOtp('');
      } else {
        setOtpErrorMsg(res.message);
      }
    } catch (err: any) {
      setOtpErrorMsg(err.message || 'Failed to dispatch SMS OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldownSeconds > 0) return;
    setSendingOtp(true);
    setOtpErrorMsg('');
    setOtpSuccessMsg('');
    
    // Uniqueness Check: Check if mobile number is already registered across any role
    const phoneCheck = db.isPhoneRegistered(formData.mobile);
    if (phoneCheck.registered) {
      setOtpErrorMsg(phoneCheck.message || 'This mobile number is already registered.');
      setSendingOtp(false);
      return;
    }

    try {
      const res = await (otpSessionId ? resendOtp(otpSessionId, 'Farmer') : sendOtp(formData.mobile, 'Farmer'));
      if (res.success && res.sessionId) {
        setOtpSessionId(res.sessionId);
        setOtpSent(true);
        setOtpSuccessMsg(res.message);
        setExpiresInSeconds(res.expiresInSeconds || 300);
        setCooldownSeconds(res.cooldownSeconds || 30);
        setIsExpired(false);
        setEnteredOtp('');
      } else {
        setOtpErrorMsg(res.message);
        if (res.cooldownSeconds) setCooldownSeconds(res.cooldownSeconds);
      }
    } catch (err: any) {
      setOtpErrorMsg(err.message || 'Failed to resend OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyAndSubmit = async () => {
    if (enteredOtp.length !== 6) {
      setOtpErrorMsg('Please enter the full 6-digit numeric OTP.');
      return;
    }

    // Final Uniqueness Check
    const phoneCheck = db.isPhoneRegistered(formData.mobile);
    if (phoneCheck.registered) {
      setOtpErrorMsg(phoneCheck.message || 'This mobile number is already registered.');
      return;
    }

    setVerifyingOtp(true);
    setOtpErrorMsg('');

    try {
      const verifyRes = await verifyOtpBackend(otpSessionId, formData.mobile, enteredOtp);

      if (!verifyRes.success) {
        setOtpErrorMsg(verifyRes.message);
        if (verifyRes.isExpired) setIsExpired(true);
        setVerifyingOtp(false);
        return;
      }

      setLoading(true);

      // 1. Create user in users collection with their chosen password and mobile (Pending Manager Verification)
      const users = db.getCollection('users');
      const newUserId = `usr-${Date.now()}`;
      users.push({
        id: newUserId,
        role: 'farmer',
        name: formData.name.trim(),
        phone: formData.mobile.trim(),
        email: formData.email.trim() || `farmer_${Date.now()}@krishiflow.ai`,
        password: formData.password,
        approval_status: 'pending',
        account_status: 'active',
        society_id: formData.society_id,
        centre_id: formData.centre_id,
        created_at: new Date().toISOString(),
      });
      db.setCollection('users', users);

      // 2. Create farmer record with pending kyc
      const farmers = db.getCollection<Farmer>('farmers');
      const newFarmerId = `far-${Date.now()}`;
      farmers.push({
        id: newFarmerId,
        user_id: newUserId,
        name: formData.name.trim(),
        father_husband_name: 'Resident Farmer',
        aadhaar_masked: formData.aadhaar.trim(),
        village: formData.village.trim(),
        district: formData.district.trim(),
        block: formData.block.trim(),
        state: formData.state.trim(),
        land_area_hectares: Number(formData.land_area_hectares) || 2.0,
        bank_account: formData.bank_account.trim(),
        ifsc_code: formData.ifsc.trim().toUpperCase(),
        alternate_contact_phone: formData.mobile.trim(),
        kyc_status: 'pending',
        latitude: 21.4669,
        longitude: 83.9812,
        created_at: new Date().toISOString(),
      });
      db.setCollection('farmers', farmers);

      setLoading(false);
      navigate('/login', {
        state: {
          message: `✅ Registration submitted successfully for ${formData.name}! Aapka registration State Manager ke verification ke liye submit ho gaya hai. Manager ke verify/approve karne ke baad aap login kar sakenge.`,
        },
      });
    } catch (err: any) {
      setOtpErrorMsg(err.message || 'OTP verification encountered an error.');
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Kisan Enrollment Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Farmer Account Registration
          </h1>
          <p className="text-xs text-slate-500">
            Step {step} of 4 • Certified Government Agriculture Marketing Database
          </p>
        </div>

        {/* Progress Bar */}
        <div className="grid grid-cols-4 gap-2 mb-8 text-xs font-semibold text-center">
          {['1. Personal & Password', '2. Select Society', '3. Select Mandi', '4. OTP Verify'].map(
            (label, idx) => {
              const sNum = idx + 1;
              const isCurr = step === sNum;
              const isPast = step > sNum;
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isCurr
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                      : isPast
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  <span>{label}</span>
                </div>
              );
            }
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 font-semibold space-y-2 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
            {error.includes('already registered') && (
              <div className="pt-2 pl-7">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Go to Login Page →</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Step Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200">
          {/* STEP 1: Personal & Bank Details with Password */}
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Step 1: Personal, Contact & Login Password Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Farmer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number (Login ID & SMS) *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="farmer@domain.com (optional)"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Aadhaar (Masked) *</label>
                  <input
                    type="text"
                    required
                    value={formData.aadhaar}
                    onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
                    placeholder="XXXX-XXXX-1234"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Village Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    placeholder="e.g. Nuapali"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="e.g. Bargarh"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Cultivated Land Area (Hectares) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.land_area_hectares}
                    onChange={(e) => setFormData({ ...formData, land_area_hectares: e.target.value })}
                    placeholder="e.g. 2.5"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Account Number (PFMS DBT) *</label>
                  <input
                    type="text"
                    required
                    value={formData.bank_account}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                    placeholder="e.g. 308912345678"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Bank IFSC Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.ifsc}
                    onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                    placeholder="e.g. SBIN0001234"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-mono"
                  />
                </div>
              </div>

              {/* Secure Password Creation Section */}
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>Set Your Personal Login Password</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  You will use your <b>Mobile Number</b> and this <b>Password</b> to log in to your Kisan Portal dashboard anytime.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Create Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Create personal password..."
                        className="w-full p-2.5 pr-10 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Re-enter password..."
                        className="w-full p-2.5 pr-10 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {formData.password && formData.confirmPassword && (
                  <div className="text-[11px] font-bold">
                    {formData.password === formData.confirmPassword ? (
                      <span className="text-emerald-700 flex items-center gap-1">✓ Passwords match successfully</span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1">✗ Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleStep1Next}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Continue to Step 2 (Society)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Society */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Step 2: Link Primary Agriculture Cooperative Society (PACS)
              </h3>
              <p className="text-xs text-slate-500">
                Choose the cooperative society nearest to your agricultural land.
              </p>

              <div className="space-y-3">
                {societies.map((soc) => (
                  <div
                    key={soc.id}
                    onClick={() => setFormData({ ...formData, society_id: soc.id })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      formData.society_id === soc.id
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        {soc.code}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">{soc.name}</h4>
                      <p className="text-xs text-slate-500">{soc.address}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">
                      {formData.society_id === soc.id ? '✓ Selected' : 'Choose'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Continue to Mandi Selection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Select Procurement Centre (Map + List) */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Step 3: Select Preferred Procurement Mandi Yard
              </h3>
              <p className="text-xs text-slate-500">
                Choose the official Mandi location where your grain will be weighed and graded.
              </p>

              <InteractiveMap
                selectedCentreId={formData.centre_id}
                onSelectCentre={(c) => setFormData({ ...formData, centre_id: c.id })}
              />

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(4);
                    handleSendOtp();
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Proceed to OTP Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: OTP Verification (Live SMS Gateway) */}
          {step === 4 && (
            <div className="space-y-6 text-center max-w-lg mx-auto py-4 animate-fade-in">
              <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                <KeyRound className="w-8 h-8" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                </span>
              </div>

              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/90 border border-emerald-300 px-3 py-1 rounded-full">
                  Two-Factor Authentication
                </span>
                <h3 className="font-extrabold text-2xl text-slate-900 mt-2">
                  Aadhaar Mobile OTP Verification
                </h3>
                <p className="text-xs text-slate-600 mt-1.5">
                  A secure 6-digit verification code has been dispatched to{' '}
                  <span className="font-bold text-slate-900 font-mono">
                    {maskPhoneNumber(formData.mobile)}
                  </span>
                </p>
              </div>

              {/* Status & Feedback Banners */}
              {otpSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300/80 rounded-2xl text-xs text-emerald-800 flex items-center gap-2.5 text-left animate-fade-in">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">{otpSuccessMsg}</p>
                    <p className="text-[10px] text-emerald-700/80 mt-0.5">
                      Please enter the code within 5 minutes.
                    </p>
                  </div>
                </div>
              )}

              {otpErrorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-900 flex flex-col gap-2 text-left animate-fade-in">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold leading-relaxed">{otpErrorMsg}</p>
                    </div>
                  </div>
                  {otpErrorMsg.includes('already registered') && (
                    <div className="pt-1 pl-7">
                      <Link
                        to="/login"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Go to Login Page →</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* 6-Digit OTP Input & Validity Timer */}
              <div className="space-y-4 bg-slate-50/80 p-5 rounded-3xl border border-slate-200">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold text-slate-600">Enter 6-Digit Code:</span>
                  <div className={`text-xs font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                    isExpired 
                      ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                      : expiresInSeconds < 60 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    <span>⏱️</span>
                    <span>{isExpired ? 'Expired' : `Valid for ${formatTimer(expiresInSeconds)}`}</span>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={enteredOtp}
                    disabled={isExpired || verifyingOtp || loading}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setEnteredOtp(val);
                      if (otpErrorMsg) setOtpErrorMsg('');
                    }}
                    placeholder="• • • • • •"
                    className="w-full text-center text-3xl sm:text-4xl tracking-[0.35em] font-mono font-black p-3.5 bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-2xl outline-none shadow-inner transition-all text-slate-900 disabled:opacity-50 disabled:bg-slate-100"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 text-xs text-slate-500">
                  <span>Didn't receive the SMS code?</span>
                  <button
                    type="button"
                    disabled={cooldownSeconds > 0 || sendingOtp}
                    onClick={handleResendOtp}
                    className={`font-bold transition-all px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
                      cooldownSeconds > 0 || sendingOtp
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 cursor-pointer shadow-sm'
                    }`}
                  >
                    <span>🔄</span>
                    {sendingOtp
                      ? 'Dispatching SMS...'
                      : cooldownSeconds > 0
                      ? `Resend OTP in ${cooldownSeconds}s`
                      : 'Resend 6-Digit OTP'}
                  </button>
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={loading || verifyingOtp}
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Mandi
                </button>

                <button
                  type="button"
                  disabled={loading || verifyingOtp || enteredOtp.length < 6 || isExpired}
                  onClick={handleVerifyAndSubmit}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {verifyingOtp
                      ? 'Verifying OTP...'
                      : loading
                      ? 'Finalizing Registration...'
                      : 'Verify OTP & Complete Registration'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
