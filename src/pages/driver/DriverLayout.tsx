// Vehicle Driver Dashboard Layout Shell
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home, Truck, Navigation, MapPin, Clock, CheckCircle2, 
  Bell, Settings, LogOut, Menu, X, User, Globe 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage, Language } from '../../context/LanguageContext';
import { FloatingAiAssistant } from '../../components/common/FloatingAiAssistant';
import { db, Vehicle } from '../../lib/db';

export const DriverLayout: React.FC = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const vehicles = db.getCollection<Vehicle>('vehicles');
  const driverVehicle = vehicles.find((v) => (user?.phone && v.driver_phone?.includes(user.phone)) || (user?.name && v.driver_name?.toLowerCase() === user.name.toLowerCase())) || vehicles[0];
  const vehicleReg = driverVehicle?.registration_number || 'OD-15-AB-1024';

  const navItems = [
    { label: t('driverNav.dashboard', 'Dashboard'), path: '/driver/dashboard', icon: Home },
    { label: t('driverNav.assignments', 'Pickup Assignments'), path: '/driver/assignments', icon: Truck, badge: t('driverNav.badgeActive', 'Active') },
    { label: t('driverNav.activePickup', 'Active Pickup'), path: '/driver/active-pickup', icon: Navigation, badge: t('driverNav.badgeLiveTrip', 'Live Trip') },
    { label: t('driverNav.liveGps', 'Live GPS Broadcast'), path: '/driver/live-gps', icon: MapPin, badge: t('driverNav.badgeStream', '10s Stream') },
    { label: t('driverNav.navigation', 'OSRM Navigation'), path: '/driver/navigation', icon: Navigation },
    { label: t('driverNav.history', 'Trip History'), path: '/driver/history', icon: CheckCircle2 },
    { label: t('driverNav.notifications', 'Notifications'), path: '/driver/notifications', icon: Bell, count: unreadCount },
    { label: t('driverNav.profile', 'Driver Profile'), path: '/driver/profile', icon: User },
    { label: t('driverNav.settings', 'Settings'), path: '/driver/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-100 font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 shrink-0 border-r border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-base text-white">FPP</span>
            <span className="block text-[10px] text-amber-400 font-semibold uppercase">
              {t('driverNav.portalName', 'Fleet Driver Portal')}
            </span>
          </div>
        </div>

        <div className="p-3.5 mx-3 my-2 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0">
            {user?.name?.charAt(0) || 'D'}
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-xs text-white truncate">{user?.name || 'Logistics Driver'}</p>
            <p className="text-[10px] text-emerald-400 truncate">{vehicleReg} • {t('driverNav.online', 'Online')}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    isActive ? 'bg-slate-900 text-amber-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('driverNav.logout', 'Logout Session')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
              <Truck className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('driverNav.portalName', 'Fleet Driver Portal')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Language Selector */}
            <div className="flex items-center bg-slate-100 hover:bg-slate-200/80 rounded-xl px-2.5 py-1.5 transition-colors border border-slate-200/60 shadow-sm">
              <Globe className="w-4 h-4 text-amber-600 mr-1.5 shrink-0" />
              <select
                value={currentLanguage}
                onChange={(e) => changeLanguage(e.target.value as Language)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
                aria-label="Select Language"
              >
                <option value="en">English (EN)</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="or">ଓଡ଼ିଆ (Odia)</option>
              </select>
            </div>

            <Link
              to="/driver/notifications"
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/"
              className="text-xs font-semibold text-slate-600 hover:text-amber-700 bg-slate-100 px-3 py-1.5 rounded-xl transition-colors hidden sm:inline-block"
            >
              {t('farmerNav.publicHome', 'Public Home ↗')}
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <FloatingAiAssistant />
    </div>
  );
};
