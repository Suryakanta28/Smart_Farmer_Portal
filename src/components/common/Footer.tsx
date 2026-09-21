// Application Footer with SIH 2026 Credits & Government Helpline
// KRISHIFLOW-AI - Smart India Hackathon 2026

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Leaf, Phone, Mail, ShieldCheck, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & SIH Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                <Leaf className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-white">FPP</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('footer.tagline', 'Autonomous End-to-End Farmer Procurement & Real-Time Logistics Grid.')}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('footer.architecture', 'Production-Grade Architecture')}</span>
            </div>
          </div>

          {/* Col 2: Dashboards Direct Access */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              {t('footer.roleDashboards', 'Role Dashboards')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/farmer/dashboard" className="hover:text-emerald-400 transition-colors">
                  🌾 {t('hero.roleFarmer', 'Farmer')}
                </a>
              </li>
              <li>
                <a href="/society/dashboard" className="hover:text-emerald-400 transition-colors">
                  🏘️ {t('hero.roleSociety', 'Society PACS')}
                </a>
              </li>
              <li>
                <a href="/officer/dashboard" className="hover:text-emerald-400 transition-colors">
                  🏢 {t('hero.roleOfficer', 'Procurement Mandi')}
                </a>
              </li>
              <li>
                <a href="/driver/dashboard" className="hover:text-emerald-400 transition-colors">
                  🚚 {t('hero.roleDriver', 'Vehicle Driver')}
                </a>
              </li>
              <li>
                <a href="/manager/dashboard" className="hover:text-emerald-400 transition-colors">
                  👨💼 {t('hero.roleManager', 'State Manager')}
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Key Features */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              {t('footer.innovations', 'Core Innovations')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• {t('footer.inno1', 'Real-Time GPS Vehicle Fleet Tracking (Leaflet & OSRM)')}</li>
              <li>• {t('footer.inno2', '8-Step Offline Farmer Inclusivity Wizard')}</li>
              <li>• {t('footer.inno3', 'Direct DBT Settlements via PFMS API Integration')}</li>
              <li>• {t('footer.inno4', 'Smart Capacity & Queue Alerting Algorithms')}</li>
              <li>• {t('footer.inno5', 'Multilingual AI Agro-Assistant & Voice Query')}</li>
            </ul>
          </div>

          {/* Col 4: Help & Helpline */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              {t('footer.helpline', '24/7 Farmer Helpline')}
            </h4>
            <div className="space-y-2.5 text-xs">
              <a
                href="tel:18001802026"
                className="flex items-center gap-2 text-emerald-400 font-bold hover:underline"
              >
                <Phone className="w-4 h-4" />
                <span>{t('footer.tollFree', '1800-180-2026 (Toll Free)')}</span>
              </a>
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>support@krishiflow.ai</span>
              </div>
              <div className="flex items-start gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <span>{t('footer.hubLocation', 'State Agriculture Marketing Board, Odisha & Haryana Mandi Hub')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>{t('footer.copyright', '© 2026 FPP • Ministry of Agriculture & Farmers Welfare')}</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {t('footer.realtimeConnected', 'Supabase Realtime Connected')}
            </span>
            <span>{t('footer.offlineEnabled', 'PWA Offline Enabled')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
