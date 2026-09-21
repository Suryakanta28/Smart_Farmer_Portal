// Manager Portal: PACS Societies & Registered Society Officers Directory
// FPP - Smart Farmer Procurement Platform

import React, { useState, useEffect } from 'react';
import { 
  Building, Users, Search, ShieldCheck, CheckCircle2, 
  MapPin, Phone, Mail, UserCheck, RefreshCw, X, AlertCircle, 
  Download, Eye, PhoneCall, Plus, Shield, ShieldAlert
} from 'lucide-react';
import { db, User, Society, OfflineFarmer } from '../../lib/db';

export const ManagerSocietiesPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [offlineFarmers, setOfflineFarmers] = useState<OfflineFarmer[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOfficer, setSelectedOfficer] = useState<User | null>(null);
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    setUsers(db.getCollection<User>('users'));
    setSocieties(db.getCollection<Society>('societies'));
    setOfflineFarmers(db.getCollection<OfflineFarmer>('offline_farmers'));
  };

  useEffect(() => {
    loadData();
    const unsubUsers = db.subscribe('table:users', loadData);
    const unsubSocieties = db.subscribe('table:societies', loadData);
    const unsubOffline = db.subscribe('table:offline_farmers', loadData);
    return () => {
      unsubUsers();
      unsubSocieties();
      unsubOffline();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter only society officers
  const societyOfficers = users.filter((u) => u.role === 'society_officer');

  // Handle status toggle (approve / suspend / pending)
  const handleUpdateOfficerStatus = (userId: string, newApproval: 'approved' | 'pending' | 'rejected', newAccount: 'active' | 'suspended' = 'active') => {
    const nowIso = new Date().toISOString();
    const updated = users.map((u) => {
      if (u.id === userId) {
        return { 
          ...u, 
          approval_status: newApproval, 
          account_status: newAccount,
          verified_at: newApproval === 'approved' ? nowIso : u.verified_at,
          verified_by: newApproval === 'approved' ? 'State Procurement Administrator' : u.verified_by
        };
      }
      return u;
    });
    db.setCollection('users', updated);
    if (selectedOfficer && selectedOfficer.id === userId) {
      setSelectedOfficer({ 
        ...selectedOfficer, 
        approval_status: newApproval, 
        account_status: newAccount,
        verified_at: newApproval === 'approved' ? nowIso : selectedOfficer.verified_at,
        verified_by: newApproval === 'approved' ? 'State Procurement Administrator' : selectedOfficer.verified_by
      });
    }
    showToast(`Society Officer status updated to ${newApproval.toUpperCase()}`);
  };

  const getLinkedSociety = (societyId?: string) => {
    if (!societyId) return societies[0] || null;
    return societies.find((s) => s.id === societyId) || societies[0] || null;
  };

  const districts = Array.from(new Set(societies.map((s) => s.district))).filter(Boolean);

  const filteredOfficers = societyOfficers.filter((u) => {
    const linkedSoc = getLinkedSociety(u.society_id);
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search) ||
      (linkedSoc && linkedSoc.name.toLowerCase().includes(search.toLowerCase())) ||
      (linkedSoc && linkedSoc.code.toLowerCase().includes(search.toLowerCase())) ||
      (linkedSoc && linkedSoc.district.toLowerCase().includes(search.toLowerCase()));

    const matchesDistrict = districtFilter === 'all' || (linkedSoc && linkedSoc.district === districtFilter);
    const matchesStatus = statusFilter === 'all' || u.approval_status === statusFilter;

    return matchesSearch && matchesDistrict && matchesStatus;
  });

  const approvedCount = societyOfficers.filter((u) => u.approval_status === 'approved').length;
  const pendingCount = societyOfficers.filter((u) => u.approval_status === 'pending').length;

  const handleExportCsv = () => {
    const headers = ['Officer ID,Officer Name,Role,Email,Phone,Assigned PACS Society,PACS Code,District,Approval Status,Account Status,Created Date'];
    const rows = filteredOfficers.map((u) => {
      const s = getLinkedSociety(u.society_id);
      return `"${u.id}","${u.name}","Society Officer","${u.email}","${u.phone}","${s ? s.name : 'Unassigned'}","${s ? s.code : 'N/A'}","${s ? s.district : 'N/A'}","${u.approval_status}","${u.account_status}","${u.created_at || ''}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pacs_society_officers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Society Officers list exported to CSV');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-blue-500/40 flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/80 border border-blue-500/30 text-blue-300 text-[11px] font-bold uppercase tracking-wider">
            <Building className="w-3.5 h-3.5" />
            <span>PACS Cooperative Network & Field Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            PACS Societies & Registered Officers
          </h1>
          <p className="text-xs text-blue-200/80 max-w-2xl">
            Directory of Primary Agricultural Credit Cooperative (PACS) societies and authorized field officers handling offline farmer inclusivity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Registered Society Officers
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
            {societyOfficers.length}
          </span>
          <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
            Active cooperative personnel
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Approved PACS Staff
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 block">
            {approvedCount}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
            Authorized for offline tokenization
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Pending Officer Approvals
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 block">
            {pendingCount}
          </span>
          <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
            Require State clearance
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total PACS Societies
          </span>
          <span className="text-2xl sm:text-3xl font-black text-purple-600 mt-1 block">
            {societies.length} Hubs
          </span>
          <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">
            State cooperative network
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search officer name, society, PAC code, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSearch('');
              setDistrictFilter('all');
              setStatusFilter('all');
            }}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Reset Filters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Society Officers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200/80">
              <tr>
                <th className="py-4 px-4">Officer Name & Contact</th>
                <th className="py-4 px-4">Assigned PACS Society</th>
                <th className="py-4 px-4">Society PAC Code</th>
                <th className="py-4 px-4">District / Block</th>
                <th className="py-4 px-4">Approval Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOfficers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Building className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No Society Officers found</p>
                    <p className="text-[11px]">No registered society personnel match your search criteria</p>
                  </td>
                </tr>
              ) : (
                filteredOfficers.map((officer) => {
                  const soc = getLinkedSociety(officer.society_id);
                  const isApproved = officer.approval_status === 'approved';
                  return (
                    <tr key={officer.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            {officer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                              {officer.name}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                              <span className="flex items-center gap-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {officer.phone}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {officer.email}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">
                          {soc ? soc.name : 'Sambalpur Central PAC Society'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {soc ? soc.address : 'Odisha Cooperative Hub'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200">
                          {soc ? soc.code : 'PACS-SBP-03'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{soc ? `${soc.block}, ${soc.district}` : 'Sambalpur, Odisha'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {officer.approval_status === 'approved' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit shadow-sm">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            APPROVED
                          </span>
                        ) : officer.approval_status === 'rejected' || officer.account_status === 'suspended' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit shadow-sm">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            REVOKED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit shadow-sm animate-pulse">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            PENDING APPROVAL
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedOfficer(officer);
                              setSelectedSociety(soc);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                          {officer.approval_status !== 'approved' ? (
                            <button
                              onClick={() => handleUpdateOfficerStatus(officer.id, 'approved', 'active')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm inline-flex items-center gap-1"
                              title="Verify and Approve Login"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateOfficerStatus(officer.id, 'rejected', 'suspended')}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors cursor-pointer border border-rose-200 inline-flex items-center gap-1"
                              title="Revoke & Suspend Access"
                            >
                              <ShieldAlert className="w-3 h-3" />
                              <span>Revoke</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Society Officer & PACS Modal */}
      {selectedOfficer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-600/20">
                  {selectedOfficer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedOfficer.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Registered Society Field Officer • User ID: {selectedOfficer.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedOfficer(null);
                  setSelectedSociety(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Registered Mobile</span>
                <p className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  {selectedOfficer.phone}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Official Email</span>
                <p className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  {selectedOfficer.email}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned PACS Cooperative Society</span>
                <p className="font-extrabold text-sm text-blue-900">
                  {selectedSociety ? selectedSociety.name : 'Sambalpur Central PAC Society'} ({selectedSociety ? selectedSociety.code : 'PACS-SBP-03'})
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Address: {selectedSociety ? selectedSociety.address : 'NH-53 Junction, Sambalpur, Odisha'}
                </p>
              </div>
            </div>

            {/* Officer Status Control Panel */}
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-blue-950">Officer Verification Status</h4>
                  <p className="text-[11px] text-blue-800">
                    Current Approval: <b className="uppercase">{selectedOfficer.approval_status}</b>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateOfficerStatus(selectedOfficer.id, 'approved', 'active')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                  >
                    Grant State Approval ✓
                  </button>
                  <button
                    onClick={() => handleUpdateOfficerStatus(selectedOfficer.id, 'rejected', 'suspended')}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                  >
                    Reject / Suspend
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={`tel:${selectedOfficer.phone}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                <span>Call Officer</span>
              </a>
              <button
                onClick={() => {
                  setSelectedOfficer(null);
                  setSelectedSociety(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
