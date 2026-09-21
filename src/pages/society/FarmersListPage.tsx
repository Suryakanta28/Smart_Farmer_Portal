// Registered Farmers Directory for Society Officers
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldCheck, Phone, MapPin, Eye } from 'lucide-react';
import { db, Farmer, User } from '../../lib/db';

export const FarmersListPage: React.FC = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const refresh = () => {
      const rawFarmers = db.getCollection<Farmer>('farmers');
      const allUsers = db.getCollection<User>('users');
      const validFarmers = rawFarmers.filter((f) => {
        if (f.id.includes('usr-manager') || f.user_id?.includes('usr-manager') || f.id.includes('usr-driver') || f.id.includes('usr-society') || f.id.includes('usr-procurement')) return false;
        if (f.name.includes('Dr. Alok') || f.name.includes('IAS') || f.name.includes('State Procurement Commission')) return false;
        if (f.user_id) {
          const u = allUsers.find((user) => user.id === f.user_id);
          if (u && u.role !== 'farmer') return false;
        }
        return true;
      });
      setFarmers(validFarmers);
    };
    refresh();
    const unsub = db.subscribe('table:farmers', refresh);
    return () => unsub();
  }, []);

  const filtered = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.village.toLowerCase().includes(search.toLowerCase()) ||
      f.aadhaar_masked.includes(search)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Society Farmer Membership Roll
        </h2>
        <p className="text-xs text-slate-500">
          Verified beneficiaries registered under Sambalpur Central PAC Society
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search farmer name, village, Aadhaar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Farmer Name</th>
                <th className="py-3.5 px-4">Aadhaar (Masked)</th>
                <th className="py-3.5 px-4">Village & District</th>
                <th className="py-3.5 px-4">Land Area</th>
                <th className="py-3.5 px-4">Bank IFSC</th>
                <th className="py-3.5 px-4">KYC Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{f.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{f.aadhaar_masked}</td>
                  <td className="py-3 px-4 text-slate-600">{f.village}, {f.district}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {f.land_area_hectares} Hectares
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{f.ifsc_code}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                      <ShieldCheck className="w-3 h-3" />
                      {f.kyc_status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
