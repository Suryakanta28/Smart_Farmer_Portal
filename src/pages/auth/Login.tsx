// Multi-Role Login Page (Clean, Production-Ready, Zero Demo Accounts)
// FPP - Smart Farmer Procurement Platform

import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LogIn, Lock, Phone, Mail, ArrowRight, ShieldCheck,
  UserCheck, AlertCircle, Eye, EyeOff, Sprout, Building2, Truck, Users, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../lib/db';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const successMessage = (location.state as any)?.message;

  const [role, setRole] = useState<UserRole>('farmer');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-refresh: clear fields on visit/mount
  useEffect(() => {
    setIdentifier('');
    setPassword('');
    setError('');
  }, [location.pathname]);

  const rolesConfig: { id: UserRole; title: string; subtitle: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'farmer', title: 'Farmer', subtitle: 'Kisan Portal', icon: Sprout },
    { id: 'society_officer', title: 'PACS Officer', subtitle: 'Society Level', icon: Users },
    { id: 'procurement_officer', title: 'Mandi Incharge', subtitle: 'Procurement', icon: Building2 },
    { id: 'driver', title: 'Fleet Driver', subtitle: 'Logistics', icon: Truck },
    { id: 'manager', title: 'State Admin', subtitle: 'Command HQ', icon: Shield },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your registered mobile number or email address.');
      return;
    }
    if (!password) {
      setError('Please enter your personal password.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(identifier, password, role);
    setLoading(false);

    if (res.success) {
      redirectUser(res.user?.role || role);
    } else {
      setError(res.error || 'Invalid credentials. Please verify your mobile number / email and password.');
    }
  };

  const redirectUser = (userRole: UserRole) => {
    switch (userRole) {
      case 'farmer':
        navigate('/farmer/dashboard');
        break;
      case 'society_officer':
        navigate('/society/dashboard');
        break;
      case 'procurement_officer':
        navigate('/officer/dashboard');
        break;
      case 'driver':
        navigate('/driver/dashboard');
        break;
      case 'manager':
        navigate('/manager/dashboard');
        break;
      default:
        navigate('/farmer/dashboard');
    }
  };

  const activeRoleConfig = rolesConfig.find((r) => r.id === role) || rolesConfig[0];
  const ActiveIcon = activeRoleConfig.icon;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="text-center mb-6 space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
              Government Agriculture Gateway
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Portal Account Login
            </h1>
            <p className="text-xs text-slate-500">
              Enter your registered credentials to access your official dashboard
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200">
            {/* Success Toast / Registration Redirect Alert */}
            {successMessage && (
              <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-800 font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              {/* Role Selection Tabs */}
              <div>
                <label className="font-bold text-slate-700 block mb-2">
                  Select Your Operational Role:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                  {rolesConfig.map((item) => {
                    const Icon = item.icon;
                    const isSelected = role === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setRole(item.id);
                          setError('');
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${isSelected
                            ? 'bg-emerald-600 text-white font-bold shadow-md'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                          }`}
                      >
                        <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                        <span className="text-[11px] leading-tight text-center">{item.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Login ID input */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Registered Mobile Number or Email Address *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g. 9876543210 or official email..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
              </div>

              {/* Password input */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Personal Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your account password..."
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer text-[11px]">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" />
                  <span>Keep me logged in on this device</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('');
                    setPassword('');
                    setError('');
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Clear Fields
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Authenticating...' : `Login to ${activeRoleConfig.title} Portal`}</span>
              </button>
            </form>

            {/* Registration Footer */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
              <p className="text-xs text-slate-600">
                New user? Don't have an account registered yet?{' '}
                <Link to="/register" className="text-emerald-600 font-bold hover:underline">
                  Register here →
                </Link>
              </p>
              <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected by State Agriculture Security & 2-Factor Authentication</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
