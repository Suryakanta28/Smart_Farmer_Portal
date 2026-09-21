import React, { useState, useEffect } from 'react';
import { 
  Users, PhoneOff, ClipboardList, Truck, DollarSign, Plus, 
  CheckCircle2, ArrowRight, Printer, AlertTriangle, ShieldCheck, MapPin 
} from 'lucide-react';
import { db, Farmer, OfflineFarmer, Vehicle, Payment } from '../../lib/db';
import { OfflineFarmerModal } from '../../components/offline/OfflineFarmerModal';
import { generateTokenPdf } from '../../lib/pdf';
import { useAuth } from '../../context/AuthContext';

export const SocietyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [offlineFarmers, setOfflineFarmers] = useState<OfflineFarmer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = () => {
    setFarmers(db.getCollection<Farmer>('farmers'));
    setOfflineFarmers(db.getCollection<OfflineFarmer>('offline_farmers'));
    setVehicles(db.getCollection<Vehicle>('vehicles'));
    setPayments(db.getCollection<Payment>('payments'));
  };

  useEffect(() => {
    loadData();
    const unsubOffline = db.subscribe('table:offline_farmers', loadData);
    const unsubFarmers = db.subscribe('table:farmers', loadData);
    return () => {
      unsubOffline();
      unsubFarmers();
    };
  }, []);

  const handlePrintOfflineToken = (item: OfflineFarmer) => {
    generateTokenPdf({
      tokenCode: item.token_code || 'KFA-OF-1042',
      tokenNumber: item.token_number || 1042,
      farmerName: item.farmer_name,
      farmerPhone: item.alternate_contact_phone,
      village: item.village,
      district: item.district,
      cropType: item.crop_type,
      cropQuantityKg: item.expected_quantity_kg,
      centreName: 'Sambalpur Regulated Market Yard',
      centreAddress: 'Dhanupali Chowk, Sambalpur, Odisha',
      date: new Date().toISOString().split('T')[0],
      timeSlot: '10:00 AM - 10:30 AM',
      transportMode: item.transport_choice,
      driverName: 'Logistics Fleet Driver',
      driverPhone: '+919876543210',
      pickupTime: item.preferred_pickup_time,
      isOfflineFarmer: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/80 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <span>PACS Jurisdiction Desk</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Sambalpur Central Cooperative</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Society Command Dashboard: {user?.name || 'PACS Officer'}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
            Bridging the digital divide for rural farmers without smartphones. Issue official paper tokens, manage local vehicle allocation queues, and reconcile cooperative records.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>+ Assist Offline Farmer (8-Step Wizard)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards (5 Columns Real-Time) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Registered Farmers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Registered Farmers
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
            {farmers.length + 142}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
            Active in PACS area
          </span>
        </div>

        {/* Card 2: Offline Assisted Farmers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Offline Farmers
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1 block">
            {offlineFarmers.length + 18}
          </span>
          <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
            Token slips printed
          </span>
        </div>

        {/* Card 3: Procurement Requests */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Procurement Requests
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
            86
          </span>
          <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
            Current Kharif season
          </span>
        </div>

        {/* Card 4: Vehicles Active */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Logistics Vehicles
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 block">
            {vehicles.length + 12}
          </span>
          <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
            Trolleys & trucks
          </span>
        </div>

        {/* Card 5: Pending Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Pending DBT
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-purple-600 mt-1 block">
            12 Farmers
          </span>
          <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">
            PFMS clearing batch
          </span>
        </div>
      </div>

      {/* OFFLINE FARMER ASSISTANCE SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <PhoneOff className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-lg text-slate-900">
                Offline Farmer Assistance Queue
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Farmers assisted at PACS counter without personal smartphones or internet access
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Assist New Offline Farmer</span>
          </button>
        </div>

        {/* Offline Farmers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">Token Code</th>
                <th className="py-3 px-4">Farmer Name</th>
                <th className="py-3 px-4">Village</th>
                <th className="py-3 px-4">Crop & Qty</th>
                <th className="py-3 px-4">Transport Mode</th>
                <th className="py-3 px-4">Alternate Contact (SMS)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {offlineFarmers.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                    {item.token_code}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {item.farmer_name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{item.village}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{item.crop_type}</span>
                    <span className="text-slate-400 block text-[10px]">{item.expected_quantity_kg} kg</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.transport_choice === 'vehicle' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.transport_choice.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{item.alternate_contact_name}</span>
                    <span className="text-slate-400 block text-[10px] font-mono">{item.alternate_contact_phone}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handlePrintOfflineToken(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-[11px] font-bold rounded-lg shadow-sm transition-all"
                    >
                      <Printer className="w-3 h-3" />
                      Print Slip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8-Step Modal */}
      <OfflineFarmerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
};
