// Statewide Analytics Deep Dive for Manager (Recharts)
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { BarChart3, TrendingUp, Download, ShieldCheck } from 'lucide-react';

export const ManagerAnalyticsPage: React.FC = () => {
  const districtData = [
    { district: 'Sambalpur', paddy: 4200, wheat: 1200 },
    { district: 'Bargarh', paddy: 5800, wheat: 800 },
    { district: 'Cuttack', paddy: 3900, wheat: 1500 },
    { district: 'Karnal', paddy: 2800, wheat: 4600 },
    { district: 'Khurda', paddy: 3100, wheat: 900 },
  ];

  const trendData = [
    { hour: '08:00', intakeTonnes: 45 },
    { hour: '10:00', intakeTonnes: 120 },
    { hour: '12:00', intakeTonnes: 280 },
    { hour: '14:00', intakeTonnes: 340 },
    { hour: '16:00', intakeTonnes: 290 },
    { hour: '18:00', intakeTonnes: 110 },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            📊 Statewide Procurement Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Grain procurement volume by district, hourly intake patterns, and MSP outlay
          </p>
        </div>

        <button
          onClick={() => alert('Exporting Statewide Executive Analytics PDF...')}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Executive Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: District Volume */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900">
            Procurement by Key Agricultural Districts (MT)
          </h3>
          <p className="text-[11px] text-slate-400">Paddy vs Wheat breakdown</p>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="district" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="paddy" fill="#16a34a" name="Paddy (MT)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wheat" fill="#eab308" name="Wheat (MT)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Hourly Intake Curve */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900">
            Today's Mandi Hourly Intake Profile (Tonnes)
          </h3>
          <p className="text-[11px] text-slate-400">Peak weighbridge load between 12:00 - 15:00</p>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="intakeTonnes" stroke="#7c3aed" fill="#ede9fe" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
