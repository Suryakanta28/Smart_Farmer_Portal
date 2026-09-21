// Farmer Settings Page
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Globe, Bell, Shield, Smartphone, CheckCircle2 } from 'lucide-react';
import { useLanguage, Language } from '../../context/LanguageContext';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [autoNavigate, setAutoNavigate] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          {t('settings.title', 'Account & Portal Preferences')}
        </h2>
        <p className="text-xs text-slate-500">
          {t('settings.subtitle', 'Configure multilingual interfaces, MSG91 SMS alerts, and offline caching')}
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {t('settings.saved', 'Preferences saved successfully!')}
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 text-xs">
        {/* Language Selection */}
        <div className="space-y-2">
          <label className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            {t('settings.displayLanguage', 'Display Language')} (i18next)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिंदी (Hindi)' },
              { code: 'or', label: 'ଓଡ଼ିଆ (Odia)' },
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code as Language)}
                className={`p-3 rounded-xl border text-center font-bold transition-all ${
                  currentLanguage === lang.code
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* SMS Notifications Toggle */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              {t('settings.smsNotifications', 'Instant SMS Notifications (MSG91)')}
            </h4>
            <p className="text-slate-500 text-[11px]">
              {t('settings.smsDesc', 'Receive automated text messages for slot bookings, vehicle dispatches, and bank DBT credits.')}
            </p>
          </div>
          <input
            type="checkbox"
            checked={smsAlerts}
            onChange={(e) => setSmsAlerts(e.target.checked)}
            className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
          />
        </div>

        {/* Realtime Navigation Toggle */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              {t('settings.turnByTurn', 'Turn-by-Turn OSRM Voice Guidance')}
            </h4>
            <p className="text-slate-500 text-[11px]">
              {t('settings.turnByTurnDesc', 'Auto-calculate directions from your village farm to the Mandi weighing entrance.')}
            </p>
          </div>
          <input
            type="checkbox"
            checked={autoNavigate}
            onChange={(e) => setAutoNavigate(e.target.checked)}
            className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
          >
            {t('settings.savePreferences', 'Save Preferences')}
          </button>
        </div>
      </div>
    </div>
  );
};
