// Dedicated Agricultural Weather & Climate Page
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React from 'react';
import { useTranslation } from 'react-i18next';
import { WeatherWidget } from '../../components/common/WeatherWidget';
import { CloudSun, Droplets, Wind, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const WeatherPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          {t('weather.title', 'Live Mandi Weather')}
        </h2>
        <p className="text-xs text-slate-500">
          {t('weather.subtitle', 'Real-time agro-climatic conditions for mandi harvesting & transport')}
        </p>
      </div>

      <WeatherWidget />

      {/* Advisory Guidelines */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-4 text-xs">
        <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
          <CloudSun className="w-5 h-5 text-amber-500" />
          {t('weather.outlook', '7-Day Harvest & Transport Outlook')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
            <h4 className="font-bold text-emerald-900">Grain Moisture Limit: ≤ 14%</h4>
            <p className="text-slate-600 leading-relaxed">
              Standard government procurement stipulates a maximum moisture threshold of 14% for Grade A Paddy and 12% for Sharbati Wheat. Dry your harvest on clean tarpaulins if ambient humidity exceeds 70%.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1.5">
            <h4 className="font-bold text-blue-900">Rain Transit Protection</h4>
            <p className="text-slate-600 leading-relaxed">
              When transporting grain in open tractor trolleys or pickup trucks during cloudy periods, waterproof tarpaulin coverings are mandatory before weighbridge check-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
