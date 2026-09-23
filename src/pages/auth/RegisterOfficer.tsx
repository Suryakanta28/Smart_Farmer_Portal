// Officer / Society / Driver Registration Page with Custom Password Setup & Society Selection
// FPP - Smart Farmer Procurement Platform (SIH 2026)

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, UploadCloud, KeyRound, CheckCircle, ArrowLeft, 
  AlertCircle, Lock, Eye, EyeOff, Phone, Mail, User, Truck, Building2,
  Building, Landmark, MapPin, Check
} from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import { db, UserRole, Vehicle, Society, ProcurementCentre } from '../../lib/db';
import { supabaseDb, resolveSocietyUUID, resolveCentreUUID } from '../../lib/supabase';
import { sendOtp, resendOtp, verifyOtpBackend, maskPhoneNumber } from '../../lib/otp';

type OfficerRole = 'society_officer' | 'procurement_officer' | 'driver';

export const RegisterOfficer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawRole = searchParams.get('role');
  const initialRole: OfficerRole = (rawRole === 'procurement_officer' || rawRole === 'driver') ? rawRole : 'society_officer';

  const [role, setRole] = useState<OfficerRole>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [regNo, setRegNo] = useState('');
  const [docUploaded, setDocUploaded] = useState(false);

  // Society & Mandi Centre Selection
  const societies = db.getCollection<Society>('societies');
  const centres = db.getCollection<ProcurementCentre>('centres');
  const [selectedSocietyId, setSelectedSocietyId] = useState<string>(societies[0]?.id || '11111111-1111-1111-1111-111111111101');
  const [selectedCentreId, setSelectedCentreId] = useState<string>(centres[0]?.id || '22222222-2222-2222-2222-222222222201');

  // Password State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // OTP State
  const [otpSessionId, setOtpSessionId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [otpErrorMsg, setOtpErrorMsg] = useState('');
  const [expiresInSeconds, setExpiresInSeconds] = useState(300);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  // Clean auto-refresh on mount / navigation
  useEffect(() => {
    setName('');
    setEmail('');
    setPhone('');
    setDesignation('');
    setRegNo('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setOtpSent(false);
    setDocUploaded(false);
    setOtpErrorMsg('');
    setOtpSuccessMsg('');
    if (societies.length > 0) setSelectedSocietyId(societies[0].id);
    if (centres.length > 0) setSelectedCentreId(centres[0].id);
  }, []);

  // 5-minute countdown
  useEffect(() => {
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

  // Cooldown countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const validateFormBeforeOtp = (): boolean => {
    setOtpErrorMsg('');
    if (!name.trim()) {
      setOtpErrorMsg('Please enter your full official name.');
      return false;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setOtpErrorMsg('Please enter a valid 10-digit mobile number.');
      return false;
    }

    // Uniqueness Check across all roles
    const phoneCheck = db.isPhoneRegistered(phone);
    if (phoneCheck.registered) {
      setOtpErrorMsg(phoneCheck.message || 'This mobile number is already registered.');
      return false;
    }

    if (role === 'society_officer' && !selectedSocietyId) {
      setOtpErrorMsg('Please select your assigned PACS Society.');
      return false;
    }

    if (role === 'procurement_officer' && !selectedCentreId) {
      setOtpErrorMsg('Please select your assigned Mandi / Procurement Centre.');
      return false;
    }

    if (!password) {
      setOtpErrorMsg('Please create a personal login password for your account.');
      return false;
    }
    if (password.length < 4) {
      setOtpErrorMsg('Password must be at least 4 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setOtpErrorMsg('Password and Confirm Password do not match. Please re-enter.');
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateFormBeforeOtp()) return;

    setSendingOtp(true);
    setOtpErrorMsg('');
    setOtpSuccessMsg('');
    setIsExpired(false);

    try {
      const res = await sendOtp(phone, role.replace('_', ' '));
      if (res.success && res.sessionId) {
        setOtpSessionId(res.sessionId);
        setOtpSent(true);
        setOtpSuccessMsg(res.message);
        setExpiresInSeconds(res.expiresInSeconds || 300);
        setCooldownSeconds(res.cooldownSeconds || 30);
        setOtp('');
      } else {
        setOtpErrorMsg(res.message);
      }
    } catch (err: any) {
      setOtpErrorMsg(err.message || 'Failed to dispatch SMS OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldownSeconds > 0) return;

    // Uniqueness Check across all roles
    const phoneCheck = db.isPhoneRegistered(phone);
    if (phoneCheck.registered) {
      setOtpErrorMsg(phoneCheck.message || 'This mobile number is already registered.');
      return;
    }

    setSendingOtp(true);
    setOtpErrorMsg('');
    setOtpSuccessMsg('');

    try {
      const res = await (otpSessionId ? resendOtp(otpSessionId, role.replace('_', ' ')) : sendOtp(phone, role.replace('_', ' ')));
      if (res.success && res.sessionId) {
        setOtpSessionId(res.sessionId);
        setOtpSent(true);
        setOtpSuccessMsg(res.message);
        setExpiresInSeconds(res.expiresInSeconds || 300);
        setCooldownSeconds(res.cooldownSeconds || 30);
        setIsExpired(false);
        setOtp('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      handleSendOtp();
      return;
    }

    if (otp.length !== 6) {
      setOtpErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    // Final Uniqueness Check across all roles
    const phoneCheck = db.isPhoneRegistered(phone);
    if (phoneCheck.registered) {
      setOtpErrorMsg(phoneCheck.message || 'This mobile number is already registered.');
      return;
    }

    setVerifyingOtp(true);
    setOtpErrorMsg('');

    try {
      const verifyRes = await verifyOtpBackend(otpSessionId, phone, otp);

      if (!verifyRes.success) {
        setOtpErrorMsg(verifyRes.message);
        if (verifyRes.isExpired) setIsExpired(true);
        setVerifyingOtp(false);
        return;
      }

      // Submit registration request to Supabase registration_requests table (Status: pending)
      const reqId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-off-${Date.now()}`;
      await supabaseDb.submitRegistrationRequest({
        id: reqId,
        role,
        full_name: name.trim(),
        mobile_number: phone.trim(),
        email: email.trim() || `${role}_${Date.now()}@krishiflow.ai`,
        password: password,
        designation: designation.trim() || (role === 'society_officer' ? 'PACS Officer / Incharge' : role === 'procurement_officer' ? 'Procurement Inspector' : 'Fleet Driver'),
        society_id: role === 'society_officer' ? selectedSocietyId : undefined,
        centre_id: role === 'procurement_officer' ? selectedCentreId : undefined,
        vehicle_reg_no: role === 'driver' ? regNo || 'OD-15-AB-1024' : undefined,
        status: 'pending',
        requested_at: new Date().toISOString(),
      });

      navigate('/login', {
        state: {
          message: `✅ Aapka registration successful hai, State Manager approval ka wait kijiye.`,
        },
      });
    } catch (err: any) {
      setOtpErrorMsg(err.message || 'Verification failed.');
      setVerifyingOtp(false);
    }
  };

  const selectedSociety = societies.find((s) => s.id === selectedSocietyId);
  const selectedCentre = centres.find((c) => c.id === selectedCentreId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full">
        <div className="text-center mb-8 space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Official Personnel Onboarding
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 capitalize">
            {role.replace('_', ' ')} Registration
          </h1>
          <p className="text-xs text-slate-500">
            Select your assigned jurisdiction and configure your login credentials with 2-Factor SMS Verification
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Role Switcher */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Official Operational Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as OfficerRole)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-semibold cursor-pointer text-slate-900"
              >
                <option value="society_officer">Society Officer (PACS Primary Cooperative)</option>
                <option value="procurement_officer">Procurement Officer (Mandi Mandate)</option>
                <option value="driver">Logistics Vehicle Driver</option>
              </select>
            </div>

            {/* SOCIETY OFFICER: PACS SOCIETY SELECTION */}
            {role === 'society_officer' && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 p-4 rounded-2xl border-2 border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-blue-950 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Select Assigned PACS Society Jurisdiction *</span>
                  </label>
                  <span className="text-[10px] font-extrabold uppercase bg-blue-600 text-white px-2 py-0.5 rounded-md">
                    Mandatory
                  </span>
                </div>

                <select
                  required
                  value={selectedSocietyId}
                  onChange={(e) => setSelectedSocietyId(e.target.value)}
                  className="w-full p-3 bg-white border border-blue-300 rounded-xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm text-xs"
                >
                  {societies.map((soc) => (
                    <option key={soc.id} value={soc.id}>
                      {soc.name} ({soc.code}) — {soc.block}, {soc.district}
                    </option>
                  ))}
                </select>

                {selectedSociety && (
                  <div className="bg-white/90 p-2.5 rounded-xl border border-blue-100 flex items-start gap-2 text-[11px] text-blue-900">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">{selectedSociety.name}</span>
                      <span className="block text-slate-500">
                        {selectedSociety.address || `${selectedSociety.block}, ${selectedSociety.district}, Odisha`} • Contact: {selectedSociety.contact_phone}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-blue-800 leading-relaxed">
                  💡 <b>Jurisdiction Rule:</b> Jab aap ye society select karenge, is PACS society ke sabhi kisanon ke registration requests aapke <b>Society Officer Dashboard</b> par verify aur approve karne ke liye aayenge.
                </p>
              </div>
            )}

            {/* PROCUREMENT OFFICER: MANDI CENTRE SELECTION */}
            {role === 'procurement_officer' && (
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50/70 p-4 rounded-2xl border-2 border-teal-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-teal-950 flex items-center gap-2">
                    <Building className="w-4 h-4 text-teal-600" />
                    <span>Select Assigned Mandi / Procurement Yard Jurisdiction *</span>
                  </label>
                  <span className="text-[10px] font-extrabold uppercase bg-teal-600 text-white px-2 py-0.5 rounded-md">
                    Mandatory
                  </span>
                </div>

                <select
                  required
                  value={selectedCentreId}
                  onChange={(e) => setSelectedCentreId(e.target.value)}
                  className="w-full p-3 bg-white border border-teal-300 rounded-xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-sm text-xs"
                >
                  {centres.map((cen) => (
                    <option key={cen.id} value={cen.id}>
                      {cen.name} ({cen.code}) — {cen.district} (Cap: {cen.capacity_tonnes_per_day}T/day)
                    </option>
                  ))}
                </select>

                {selectedCentre && (
                  <div className="bg-white/90 p-2.5 rounded-xl border border-teal-100 flex items-start gap-2 text-[11px] text-teal-900">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">{selectedCentre.name}</span>
                      <span className="block text-slate-500">
                        {selectedCentre.address} • Operating: {selectedCentre.operating_hours}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Official Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Subhashree Barik"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Number (Login ID & SMS) *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Official Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. officer.sambalpur@fpp.gov.in"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {role === 'driver' ? (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Vehicle Registration / Commercial DL Number *</label>
                <input
                  type="text"
                  required
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="e.g. OD-15-AB-1024 or DL-29381920"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Designation *</label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder={role === 'society_officer' ? 'e.g. PACS Secretary / Field Incharge' : 'e.g. Quality Inspector / Yard Officer'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Custom Password Fields */}
            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-3">
              <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
                <Lock className="w-4 h-4 text-blue-700" />
                <span>Create Personal Login Password</span>
              </div>
              <p className="text-[11px] text-blue-800">
                You will use your <b>Mobile Number</b> and this <b>Password</b> to log in to your official portal dashboard.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Create Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create personal password..."
                      className="w-full p-2.5 pr-10 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
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
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password..."
                      className="w-full p-2.5 pr-10 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
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

              {password && confirmPassword && (
                <div className="text-[11px] font-bold">
                  {password === confirmPassword ? (
                    <span className="text-emerald-700 flex items-center gap-1">✓ Passwords match successfully</span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1">✗ Passwords do not match</span>
                  )}
                </div>
              )}
            </div>

            {/* Document Upload Simulation */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Upload Proof of Appointment / Government ID Proof (PDF or Image) *
              </label>
              <div
                onClick={() => setDocUploaded(true)}
                className={`border-2 border-dashed p-4 rounded-xl text-center cursor-pointer transition-colors ${
                  docUploaded
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 hover:border-blue-500 bg-slate-50'
                }`}
              >
                <UploadCloud className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                <span className="font-semibold block">
                  {docUploaded ? '✓ Identity Certificate Uploaded (Encrypted in Storage)' : 'Click to Upload Official Identification'}
                </span>
                <span className="text-[10px] text-slate-400">PDF, JPG up to 10MB</span>
              </div>
            </div>

            {/* Feedback Banners */}
            {otpSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-800 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{otpSuccessMsg}</span>
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
                      <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                      <span>Go to Login Page →</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* OTP Section */}
            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {sendingOtp ? 'Dispatching 6-Digit OTP via SMS...' : 'Send Mobile Verification OTP (SMS)'}
              </button>
            ) : (
              <div className="space-y-3 pt-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Enter 6-Digit Code for {maskPhoneNumber(phone)}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    isExpired ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isExpired ? 'Expired' : `⏱️ ${formatTimer(expiresInSeconds)}`}
                  </span>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  disabled={isExpired || verifyingOtp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (otpErrorMsg) setOtpErrorMsg('');
                  }}
                  placeholder="• • • • • •"
                  className="w-full text-center text-2xl tracking-[0.35em] font-mono font-bold p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    disabled={cooldownSeconds > 0 || sendingOtp}
                    onClick={handleResendOtp}
                    className={`font-semibold ${
                      cooldownSeconds > 0 ? 'text-slate-400' : 'text-blue-600 hover:underline cursor-pointer'
                    }`}
                  >
                    {sendingOtp ? 'Sending...' : cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : 'Resend OTP'}
                  </button>

                  <span className="text-[10px] text-slate-400">Valid for 5 mins</span>
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp || otp.length < 6 || isExpired}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  {verifyingOtp ? 'Verifying OTP...' : 'Verify OTP & Submit Official Registration'}
                </button>
              </div>
            )}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};
