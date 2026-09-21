// Real-Time GPS Vehicle Tracking Page for Farmer
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React from 'react';
import { useTranslation } from 'react-i18next';
import { LiveGpsMap } from '../../components/map/LiveGpsMap';
import { ShieldCheck, Truck, Clock, Navigation } from 'lucide-react';

export const VehicleTrackingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
            {t('tracking.telemetryTag', 'Autonomous Fleet Telemetry')}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            {t('tracking.title', 'Live GPS Vehicle Tracking')}
          </h2>
          <p className="text-xs text-slate-500">
            {t('tracking.subtitle', 'Real-time geospatial stream of your assigned harvest pickup trolley moving to Mandi')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            {t('tracking.streamStatus', 'Supabase Realtime Stream: 10s Updates')}
          </span>
        </div>
      </div>

      {/* Full Map Component */}
      <LiveGpsMap vehicleId="veh-01" tripId="trip-01" centreId="cen-03" />

      {/* Telemetry Guide Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
            1
          </div>
          <div>
            <h4 className="font-bold text-slate-800">{t('tracking.markerFarm', 'Blue Marker (Farm)')}</h4>
            <p className="text-slate-500 text-[11px] mt-0.5">
              {t('tracking.markerFarmDesc', 'Your registered pickup point at Sambalpur Rural Village square.')}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            2
          </div>
          <div>
            <h4 className="font-bold text-slate-800">{t('tracking.markerTruck', 'Green Truck (Live)')}</h4>
            <p className="text-slate-500 text-[11px] mt-0.5">
              {t('tracking.markerTruckDesc', 'Assigned mini truck moving in real-time. Speed & ETA computed dynamically.')}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
            3
          </div>
          <div>
            <h4 className="font-bold text-slate-800">{t('tracking.markerMandi', 'Red Building (Mandi)')}</h4>
            <p className="text-slate-500 text-[11px] mt-0.5">
              {t('tracking.markerMandiDesc', 'Sambalpur Regulated Market Yard destination and digital weighbridge.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
