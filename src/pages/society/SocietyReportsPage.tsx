// Society Reports & Statistical Analytics Page (Recharts)
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from 'recharts';
import { BarChart3, TrendingUp, Users, Download } from 'lucide-react';

export const SocietyReportsPage: React.FC = () => {
  const weeklyData = [
    { day: 'Mon', procurement: 320, offlineFarmers: 6 },
    { day: 'Tue', procurement: 410, offlineFarmers: 8 },
    { day: 'Wed', procurement: 380, offlineFarmers: 5 },
    { day: 'Thu', procurement: 520, offlineFarmers: 11 },
    { day: 'Fri', procurement: 490, offlineFarmers: 9 },
    { day: 'Sat', procurement: 610, offlineFarmers: 14 },
    { day: 'Sun', procurement: 350, offlineFarmers: 4 },
  ];

  const pieData = [
    { name: 'Self Transport', value: 68, color: '#16a34a' },
    { name: 'Free Vehicle Pickup', value: 32, color: '#2563eb' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            📊 PACS Society Analytics & Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Grain procurement throughput, offline inclusion ratios, and vehicle dispatch distribution
          </p>
        </div>

        <button
          onClick={() => alert('Exporting PACS comprehensive CSV report...')}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Daily Procurement Throughput */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Weekly Mandi Procurement (Quintals)
              </h3>
              <p className="text-[11px] text-slate-400">Total volume recorded via computerized weighbridge</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              ↑ +24% YoY
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="procurement" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Transport Mode Ratio */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Transport Mode Split
            </h3>
            <p className="text-[11px] text-slate-400">Self Transport vs Free Pickup</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={4}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <span>Self (68%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <span>Vehicle (32%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
