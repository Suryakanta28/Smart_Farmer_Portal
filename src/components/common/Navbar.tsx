// Main Sticky Navbar with FPP Leaf Logo, Language Selector & Auth
// Smart Farmer Procurement Platform

import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf, Globe, LogIn, UserPlus, LayoutDashboard, LogOut, Menu, X, Truck, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, Language } from '../../context/LanguageContext';

export const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { currentLanguage, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const languages: { code: Language; label: string; nativeLabel: string; flag: string }[] = [
    { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी', flag: '🇮🇳' },
    { code: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ', flag: '🌾' },
  ];

  const currentLangObj = languages.find((l) => l.code === currentLanguage) || languages[0];

  const handleMouseEnterLang = () => {
    if (langTimeoutRef.current) clearTimeout(langTimeoutRef.current);
    setLangDropdownOpen(true);
  };

  const handleMouseLeaveLang = () => {
    langTimeoutRef.current = setTimeout(() => {
      setLangDropdownOpen(false);
    }, 150);
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'farmer':
        return '/farmer/dashboard';
      case 'society_officer':
        return '/society/dashboard';
      case 'procurement_officer':
        return '/officer/dashboard';
      case 'driver':
        return '/driver/dashboard';
      case 'manager':
        return '/manager/dashboard';
      default:
        return '/farmer/dashboard';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.location.hash) {
        window.history.pushState(null, '', '/');
      }
    } else {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSectionClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `#${sectionId}`);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo: FPP with Leaf Icon */}
          <a
            href="/"
            onClick={handleHomeClick}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5 text-emerald-100" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-1.5">
                FPP
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                Smart Farmer Procurement Portal
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={handleHomeClick}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              {t('nav.home', 'Home')}
            </button>
            <button
              onClick={(e) => handleSectionClick(e, 'how-it-works')}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              {t('nav.howItWorks', 'How It Works')}
            </button>
            <button
              onClick={(e) => handleSectionClick(e, 'centres')}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              {t('nav.centres', 'Procurement Centres')}
            </button>
            <button
              onClick={(e) => handleSectionClick(e, 'services')}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              {t('nav.services', 'Services')}
            </button>
            <button
              onClick={(e) => handleSectionClick(e, 'about')}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              {t('nav.about', 'About')}
            </button>
          </nav>

          {/* Actions: Language Selector, Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Selector (Reveals options on Mouse Hover) */}
            <div
              className="relative group py-2"
              onMouseEnter={handleMouseEnterLang}
              onMouseLeave={handleMouseLeaveLang}
            >
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all border border-slate-200/80 shadow-sm cursor-pointer"
                aria-label="Language"
              >
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>{currentLangObj.nativeLabel}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    langDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>

              {/* Floating Dropdown visible ONLY on Hover */}
              <div
                className={`absolute right-0 top-full pt-1 w-44 transition-all duration-200 z-50 ${
                  langDropdownOpen
                    ? 'opacity-100 visible translate-y-0 pointer-events-auto'
                    : 'opacity-0 invisible -translate-y-1 pointer-events-none'
                }`}
              >
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-1.5 space-y-1 backdrop-blur-md">
                  {languages.map((lang) => {
                    const isSelected = currentLanguage === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          changeLanguage(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/80'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{lang.flag}</span>
                          <span>{lang.nativeLabel}</span>
                          <span className="text-[10px] text-slate-400">({lang.label})</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Auth Buttons */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                  <span className="capitalize bg-emerald-700 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {user.role.replace('_', ' ')}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-semibold transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t('nav.login', 'Login')}</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t('nav.register', 'Registration')}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3">
          <nav className="flex flex-col gap-2.5 text-sm font-medium text-slate-700">
            <button
              onClick={handleHomeClick}
              className="text-left py-1 hover:text-emerald-600 transition-colors"
            >
              {t('nav.home', 'Home')}
            </button>
            <button
              onClick={(e) => handleSectionClick(e, 'how-it-works')}
              className="text-left py-1 hover:text-emerald-600 transition-colors"
            >
              {t('nav.howItWorks', 'How It Works')}
            </button>
            <button
              onClick={(e) => handleSectionClick(e, 'centres')}
              className="text-left py-1 hover:text-emerald-600 transition-colors"
            >
              {t('nav.centres', 'Procurement Centres')}
            </button>
            <button
              onClick={(e) => handleSectionClick(e, 'services')}
              className="text-left py-1 hover:text-emerald-600 transition-colors"
            >
              {t('nav.services', 'Services')}
            </button>
            <button
              onClick={(e) => handleSectionClick(e, 'about')}
              className="text-left py-1 hover:text-emerald-600 transition-colors"
            >
              {t('nav.about', 'About')}
            </button>
            <Link to="/track" onClick={() => setMobileMenuOpen(false)} className="text-emerald-600 font-semibold flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              <span>{t('nav.liveVehicleTracking', 'Live Vehicle Tracking')}</span>
            </Link>
          </nav>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">{t('nav.language', 'Language')}:</span>
            <div className="flex gap-2">
              <button
                onClick={() => changeLanguage('en')}
                className={`text-xs px-2 py-1 rounded ${currentLanguage === 'en' ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('hi')}
                className={`text-xs px-2 py-1 rounded ${currentLanguage === 'hi' ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}
              >
                हिंदी
              </button>
              <button
                onClick={() => changeLanguage('or')}
                className={`text-xs px-2 py-1 rounded ${currentLanguage === 'or' ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}
              >
                ଓଡ଼ିଆ
              </button>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                >
                  {t('nav.goToDashboard', 'Go to Dashboard')} ({user.role.replace('_', ' ')})
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2 bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold"
                >
                  {t('nav.logout', 'Logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold"
                >
                  {t('nav.login', 'Login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                >
                  {t('nav.registerNow', 'Register Now')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
