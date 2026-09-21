// Farmer Dashboard Sidebar & Layout Shell
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home, User, Sprout, ClipboardList, Ticket, Truck, MapPin, 
  Hourglass, DollarSign, FileText, Bell, Bot, CloudSun, Settings, 
  LogOut, Menu, X, Leaf, Globe 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage, Language } from '../../context/LanguageContext';
import { FloatingAiAssistant } from '../../components/common/FloatingAiAssistant';
import { db, Farmer } from '../../lib/db';

export const FarmerLayout: React.FC = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [farmer, setFarmer] = useState<Farmer>(() => db.getFarmerByUserId(user?.id));

  useEffect(() => {
    const refresh = () => {
      setFarmer(db.getFarmerByUserId(user?.id));
    };
    refresh();
    const unsubFarmers = db.subscribe('table:farmers', refresh);
    const unsubUsers = db.subscribe('table:users', refresh);
    return () => {
      unsubFarmers();
      unsubUsers();
    };
  }, [user?.id]);

  const navItems = [
    { label: t('farmerNav.dashboard', 'Dashboard'), path: '/farmer/dashboard', icon: Home },
    { label: t('farmerNav.myCrops', 'My Crops'), path: '/farmer/crops', icon: Sprout },
    { label: t('farmerNav.procurementFlow', 'Procurement Flow'), path: '/farmer/procurement', icon: ClipboardList, badge: t('farmerNav.stepWizard', 'Step Wizard') },
    { label: t('farmerNav.slotsTokens', 'Slots & Tokens'), path: '/farmer/slots-tokens', icon: Ticket },
    { label: t('farmerNav.transportMode', 'Transport Mode'), path: '/farmer/transport', icon: Truck },
    { label: t('farmerNav.vehicleTracking', 'Vehicle Tracking'), path: '/farmer/vehicle-tracking', icon: MapPin, badge: t('farmerNav.liveGps', 'Live GPS') },
    { label: t('farmerNav.queueStatus', 'Queue Status'), path: '/farmer/queue', icon: Hourglass },
    { label: t('farmerNav.payments', 'Payments (DBT)'), path: '/farmer/payments', icon: DollarSign },
    { label: t('farmerNav.receipts', 'Receipts & Slips'), path: '/farmer/receipts', icon: FileText },
    { label: t('farmerNav.notifications', 'Notifications'), path: '/farmer/notifications', icon: Bell, count: unreadCount },
    { label: t('farmerNav.aiAssistant', 'AI Assistant'), path: '/farmer/ai-assistant', icon: Bot },
    { label: t('farmerNav.weather', 'Weather Forecast'), path: '/farmer/weather', icon: CloudSun },
    { label: t('farmerNav.profile', 'My Profile'), path: '/farmer/profile', icon: User },
    { label: t('farmerNav.settings', 'Settings'), path: '/farmer/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name || farmer?.name || 'Ramesh Chandra Pradhan';
  const displayAvatar = user?.avatar_url || farmer?.avatar_url || '';
  const displayDistrict = farmer?.district || 'Sambalpur';

  return (
    <div className="min-h-screen flex bg-slate-100 font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 shrink-0 border-r border-slate-800">
        {/* Brand */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base text-white">FPP</span>
              <span className="block text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                {t('farmerNav.portalName', 'Farmer Portal')}
              </span>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-3.5 mx-3 my-2 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center gap-3">
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover shrink-0 shadow-sm border-2 border-emerald-500"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              {displayName.charAt(0) || 'F'}
            </div>
          )}
          <div className="overflow-hidden">
            <p className="font-bold text-xs text-white truncate">{displayName}</p>
            <p className="text-[10px] text-emerald-400 truncate">{displayDistrict} District • Active</p>
          </div>
        </div>

        {/* Nav Links */}
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
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
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

        {/* Logout */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('farmerNav.logout', 'Logout Session')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-slate-900 text-slate-300 flex flex-col z-10">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-white text-sm">{t('farmerNav.farmerMenu', '🌾 Farmer Menu')}</span>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Language Switcher */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                {t('nav.language', 'Language')}:
              </span>
              <div className="flex gap-1.5">
                {(['en', 'hi', 'or'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => changeLanguage(l)}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      currentLanguage === l
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {l === 'en' ? 'EN' : l === 'hi' ? 'हिंदी' : 'ଓଡ଼ିଆ'}
                  </button>
                ))}
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold ${
                      isActive ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-bold rounded-lg transition-colors"
              >
                {t('farmerNav.logout', 'Logout Session')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar for mobile and quick info with Language Switcher */}
        <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('farmerNav.portalName', 'Farmer Portal')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Language Switcher Dropdown */}
            <div className="flex items-center bg-slate-100 hover:bg-slate-200/80 rounded-xl px-2.5 py-1.5 transition-colors border border-slate-200/60 shadow-sm">
              <Globe className="w-4 h-4 text-emerald-600 mr-1.5 shrink-0" />
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

            {/* Notifications */}
            <Link
              to="/farmer/notifications"
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title={t('farmerNav.notifications', 'Notifications')}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Public Home Link */}
            <Link
              to="/"
              className="text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-xl transition-colors hidden sm:inline-block"
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
