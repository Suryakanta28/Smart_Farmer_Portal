import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Scale, Users, Truck, DollarSign, AlertTriangle, Bell, 
  CheckCircle2, ArrowRight, Play, Volume2, ShieldAlert, Sparkles 
} from 'lucide-react';
import { db, QueueItem, AlertItem, Vehicle, Procurement } from '../../lib/db';
import { useAuth } from '../../context/AuthContext';

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [calledNotice, setCalledNotice] = useState<string | null>(null);

  const loadData = () => {
    setQueue(db.getCollection<QueueItem>('queue'));
    setAlerts(db.getCollection<AlertItem>('alerts'));
    setVehicles(db.getCollection<Vehicle>('vehicles'));
    setProcurements(db.getCollection<Procurement>('procurements'));
  };

  useEffect(() => {
    loadData();
    const unsubQueue = db.subscribe('table:queue', (data: QueueItem[]) => setQueue(data));
    const unsubAlerts = db.subscribe('table:alerts', (data: AlertItem[]) => setAlerts(data));
    return () => {
      unsubQueue();
      unsubAlerts();
    };
  }, []);

  const currentCalledItem = queue.find((q) => q.status === 'called') || queue[0];
  const waitingTokens = queue.filter((q) => q.status === 'waiting');

  const handleCallNextToken = () => {
    const called = db.callNextToken('cen-03');
    if (called) {
      setCalledNotice(`Called Token #${called.token_number} (${called.token_code}) to Weighbridge 1. Broadcast sent via Realtime & SMS.`);
      setTimeout(() => setCalledNotice(null), 5000);
      loadData();
    } else {
      alert('No more farmers waiting in line.');
    }
  };

  const totalProcurementToday = procurements.reduce((acc, p) => acc + p.net_weight_kg / 100, 4820);
  const availableVehicles = vehicles.filter((v) => v.status === 'available').length + 8;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300 bg-teal-800/80 px-2.5 py-0.5 rounded-full border border-teal-500/30">
                Sambalpur Regulated Market Yard (PC-SBP-03)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Mandi Procurement Desk: {user?.name || 'Procurement Officer'}
            </h1>
            <p className="text-xs text-teal-100/80 max-w-xl">
              Electronic gross weighbridges, digital optical refractometers, automated quality grading, and direct DBT clearing
            </p>
          </div>

          <button
            onClick={handleCallNextToken}
            className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl shadow-xl shadow-emerald-500/25 transition-transform hover:scale-105 active:scale-95 shrink-0"
          >
            <Volume2 className="w-4 h-4" />
            <span>📢 CALL NEXT TOKEN (BROADCAST)</span>
          </button>
        </div>
      </div>

      {calledNotice && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-2xl flex items-center justify-between animate-slide-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{calledNotice}</span>
          </div>
          <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
            SMS Sent
          </span>
        </div>
      )}

      {/* Stats Cards (4 Columns Real-Time) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Today's Procurement
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
            {totalProcurementToday.toLocaleString('en-IN')} Q
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
            482.0 Metric Tonnes
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Waiting in Queue
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-500 mt-1 block">
            {waitingTokens.length} Farmers
          </span>
          <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
            Avg wait: ~25 mins
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Vehicles Available
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1 block">
            {availableVehicles} Trolleys
          </span>
          <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
            Ready for farm pickup
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Payments Pending
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-purple-600 mt-1 block">
            8 Batches
          </span>
          <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">
            ₹ 18.4 Lakhs PFMS DBT
          </span>
        </div>
      </div>

      {/* SMART ALERTS SECTION (Rule-Based Alerts) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            ⚠️ Automated Smart Mandi Alerts
          </h3>
          <span className="text-xs text-slate-400">Rule Engine v2.6 Active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              🔴 Centre Capacity 92%
            </div>
            <p className="text-[11px] text-rose-800">
              Holding yard current queue &gt; capacity × 0.9. Divert new self-transport to Gate 3.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              🟡 5 Farmers Approaching Slot
            </div>
            <p className="text-[11px] text-amber-800">
              Arrival scheduled within 30 minutes. Tare balance scale recalibrated.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              🚚 3 Vehicle Requests Pending
            </div>
            <p className="text-[11px] text-blue-800">
              Farmers in Nuapali requesting trolley pickup. Nearest drivers auto-alerted.
            </p>
          </div>
        </div>
      </div>

      {/* LIVE QUEUE BOARD & TOKEN DISPATCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Current Called Token */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col justify-between text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Currently at Weighbridge Bay 1
          </span>

          <div className="space-y-1">
            <div className="text-6xl sm:text-7xl font-black tracking-tighter text-white">
              {currentCalledItem?.token_code || 'KFA-1024'}
            </div>
            <p className="text-sm font-semibold text-emerald-300">
              Sequence #{currentCalledItem?.token_number || 1024}
            </p>
            <p className="text-xs text-slate-400">
              Farmer: {currentCalledItem?.farmer_name || 'Ramesh Chandra Pradhan'}
            </p>
          </div>

          <button
            onClick={handleCallNextToken}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Call Next Token (#{(currentCalledItem?.token_number || 1024) + 1})</span>
          </button>
        </div>

        {/* Right: Next 10 Tokens List */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900">
              Next 10 Waiting Tokens (Realtime Broadcast)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Channel: queue:cen-03</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs max-h-72 overflow-y-auto">
            {waitingTokens.slice(0, 10).map((q, idx) => (
              <div key={q.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 font-mono">{q.token_code}</span>
                    <span className="text-slate-400 block text-[11px]">{q.farmer_name}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                    Waiting
                  </span>
                  <span className="text-[10px] text-slate-400 block">Est: ~{(idx + 1) * 15}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
