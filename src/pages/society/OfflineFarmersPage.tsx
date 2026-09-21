// Offline Farmers Management Page for Society Officers
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState, useEffect } from 'react';
import { PhoneOff, Plus, Printer, Search, Phone, MessageSquare, CheckCircle2 } from 'lucide-react';
import { db, OfflineFarmer } from '../../lib/db';
import { OfflineFarmerModal } from '../../components/offline/OfflineFarmerModal';
import { generateTokenPdf } from '../../lib/pdf';
import { sendSms } from '../../lib/sms';

export const OfflineFarmersPage: React.FC = () => {
  const [offlineFarmers, setOfflineFarmers] = useState<OfflineFarmer[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [smsNotification, setSmsNotification] = useState<string | null>(null);

  const loadData = () => {
    setOfflineFarmers(db.getCollection<OfflineFarmer>('offline_farmers'));
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe('table:offline_farmers', loadData);
    return () => unsub();
  }, []);

  const handlePrint = (item: OfflineFarmer) => {
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
      driverName: 'Suresh Kumar Mohapatra',
      driverPhone: '+919876543210',
      pickupTime: item.preferred_pickup_time,
      isOfflineFarmer: true,
    });
  };

  const handleResendSms = (item: OfflineFarmer) => {
    sendSms({
      phone: item.alternate_contact_phone,
      message: `Reminder for Farmer ${item.farmer_name}: Token ${item.token_code} confirmed for tomorrow 10:00 AM at Sambalpur Mandi. Transport: ${item.transport_choice.toUpperCase()}.`,
      type: 'transactional',
    });
    setSmsNotification(`SMS sent to ${item.alternate_contact_phone} for Farmer ${item.farmer_name}`);
    setTimeout(() => setSmsNotification(null), 4000);
  };

  const filtered = offlineFarmers.filter((f) =>
    f.farmer_name.toLowerCase().includes(search.toLowerCase()) ||
    f.village.toLowerCase().includes(search.toLowerCase()) ||
    f.token_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            📵 Offline Farmer Registrations & Tokens
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            PACS assisted directory of farmers without smartphones receiving SMS and printed slips
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Offline Farmer</span>
        </button>
      </div>

      {smsNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{smsNotification}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by farmer name, village, or token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Grid of Offline Farmer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-mono font-bold text-emerald-700 text-sm">
                {item.token_code}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                item.transport_choice === 'vehicle' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {item.transport_choice.toUpperCase()}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Farmer:</span>
                <span className="font-bold text-slate-900">{item.farmer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Father/Husband:</span>
                <span className="font-semibold text-slate-700">{item.father_husband_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Village & District:</span>
                <span className="font-semibold text-slate-700">{item.village}, {item.district}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Crop & Declared Weight:</span>
                <span className="font-bold text-slate-800">{item.crop_type} ({item.expected_quantity_kg} kg)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Alternate SMS Contact:</span>
                <span className="font-bold text-slate-800">{item.alternate_contact_name} ({item.alternate_contact_phone})</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleResendSms(item)}
                className="flex items-center gap-1 text-slate-600 hover:text-blue-600 text-xs font-semibold"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Resend SMS
              </button>

              <button
                onClick={() => handlePrint(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Physical Slip
              </button>
            </div>
          </div>
        ))}
      </div>

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
