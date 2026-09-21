// Agricultural Weather Information Widget with 7-Day Forecast & Alerts
// KRISHIFLOW-AI - Smart India Hackathon 2026

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CloudRain, Wind, Droplets, Sun, AlertTriangle, MapPin, RefreshCw, Compass } from 'lucide-react';
import { fetchLiveWeather, WeatherData } from '../../lib/weather';

export const WeatherWidget: React.FC = () => {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  const loadWeather = async (lat?: number, lon?: number) => {
    setLoading(true);
    const data = await fetchLiveWeather(lat, lon);
    setWeather(data);
    setLoading(false);
  };

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          loadWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Fallback location: Sambalpur, Odisha
          loadWeather(21.4669, 83.9812);
        }
      );
    } else {
      loadWeather(21.4669, 83.9812);
    }
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="h-20 bg-slate-100 rounded-xl mb-4" />
        <div className="h-12 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="bg-gradient-to-br from-white to-emerald-50/40 rounded-2xl p-6 shadow-md border border-emerald-100 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Sun className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
              {t('weather.title', 'Live Mandi Weather')}
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {t('weather.badge', 'Agro-Forecast')}
              </span>
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-600" />
              {weather.city}
            </p>
          </div>
        </div>

        <button
          onClick={() => loadWeather(userLocation?.lat, userLocation?.lon)}
          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
          title={t('weather.refresh', 'Refresh Weather')}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Weather Alerts */}
      {weather.alerts && weather.alerts.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {weather.alerts.map((alert, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-5">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-extrabold text-slate-900">
            {weather.temperature}°C
          </div>
          <div className="text-[11px] text-slate-500 leading-tight">
            {t('weather.feelsLike', 'Feels like')} <span className="font-semibold text-slate-700">{weather.feelsLike}°C</span>
            <span className="block text-emerald-600 font-medium">{weather.condition}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
          <div>
            <span className="block text-slate-400 text-[10px]">{t('weather.humidity', 'Humidity')}</span>
            <span className="font-bold text-slate-800">{weather.humidity}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Wind className="w-4 h-4 text-emerald-500 shrink-0" />
          <div>
            <span className="block text-slate-400 text-[10px]">{t('weather.windSpeed', 'Wind Speed')}</span>
            <span className="font-bold text-slate-800">{weather.windSpeed} km/h</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <CloudRain className="w-4 h-4 text-indigo-500 shrink-0" />
          <div>
            <span className="block text-slate-400 text-[10px]">{t('weather.rainfall', 'Rainfall (1h)')}</span>
            <span className="font-bold text-slate-800">{weather.rainfallMm} mm</span>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast Horizontal Scroll */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
          {t('weather.outlook', '7-Day Harvest & Transport Outlook')}
        </h4>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {weather.forecast.map((fc, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 min-w-[76px] text-center shrink-0 hover:bg-emerald-50/60 transition-colors"
            >
              <span className="text-xs font-bold text-slate-700">{fc.day}</span>
              <span className="text-xl my-1">{fc.icon}</span>
              <span className="text-[11px] font-semibold text-slate-900">
                {fc.tempMax}°
              </span>
              <span className="text-[10px] text-slate-400">
                {fc.tempMin}°
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
