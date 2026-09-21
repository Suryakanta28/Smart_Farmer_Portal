// Turn-by-Turn Navigation with OSRM Routing Steps
// FPP - Smart Farmer Procurement Platform

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigation, Compass, MapPin, Volume2, ArrowUp, ArrowRight, ArrowLeft } from 'lucide-react';
import { LiveGpsMap } from '../../components/map/LiveGpsMap';
import { fetchOsrmRoute, RouteStep } from '../../lib/osrm';

export const NavigationPage: React.FC = () => {
  const { t } = useTranslation();
  const [navigating, setNavigating] = useState(false);
  const [steps, setSteps] = useState<RouteStep[]>([]);

  useEffect(() => {
    // Initial default steps with translation
    setSteps([
      { instruction: t('driverNavigation.step1', 'Depart from Vehicle Station towards NH-53'), distance_m: 400 },
      { instruction: t('driverNavigation.step2', 'Continue straight onto Main Canal Road for 3.2 km'), distance_m: 3200 },
      { instruction: t('driverNavigation.step3', 'Turn right at Nuapali Primary School junction'), distance_m: 350 },
      { instruction: t('driverNavigation.step4', 'Arrive at Farmer Harvest Stacking Yard'), distance_m: 50 },
    ]);

    // Fetch live OSRM steps
    fetchOsrmRoute(21.4680, 83.9780, 21.4820, 83.9620).then((res) => {
      if (res.steps && res.steps.length > 0) {
        setSteps(res.steps);
      }
    });
  }, [t]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
            {t('driverNavigation.tag', 'OSRM Precision Guidance')}
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            {t('driverNavigation.title', 'Turn-by-Turn Route Guidance')}
          </h2>
          <p className="text-xs text-slate-500">
            {t('driverNavigation.subtitle', 'Automated rural road routing avoiding low bridges and weight-restricted canal paths')}
          </p>
        </div>

        <button
          onClick={() => setNavigating(!navigating)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs shadow-md transition-all self-start sm:self-auto cursor-pointer ${
            navigating ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>{navigating ? t('driverNavigation.stopVoiceNav', 'Stop Navigation') : t('driverNavigation.startVoiceNav', 'Start Voice Navigation')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-8">
          <LiveGpsMap isDriverView={true} vehicleId="veh-01" tripId="trip-01" centreId="cen-03" />
        </div>

        {/* Turn by Turn Instructions List */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-600" />
            {t('driverNavigation.maneuverSteps', 'Route Maneuver Steps (OSRM)')}
          </h3>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                  idx === 0
                    ? 'bg-amber-50 border-amber-300 font-bold text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  {idx === 0 ? <ArrowUp className="w-4 h-4 text-amber-600" /> : <ArrowRight className="w-4 h-4 text-slate-400" />}
                </div>
                <div>
                  <p className="leading-snug">{step.instruction}</p>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {t('driverNavigation.inMeters', { count: step.distance_m, defaultValue: `in ${step.distance_m} meters` })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
