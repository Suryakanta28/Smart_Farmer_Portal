// Manager Portal: Mandi Incharges & Registered Procurement Officers Directory
// FPP - Smart Farmer Procurement Platform

import React, { useState, useEffect } from 'react';
import { 
  Building2, UserCheck, Search, ShieldCheck, CheckCircle2, 
  MapPin, Phone, Mail, RefreshCw, X, AlertCircle, 
  Download, Eye, PhoneCall, Scale, Clock, TrendingUp, ShieldAlert
} from 'lucide-react';
import { db, User, ProcurementCentre } from '../../lib/db';

export const ManagerOfficersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [centres, setCentres] = useState<ProcurementCentre[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOfficer, setSelectedOfficer] = useState<User | null>(null);
  const [selectedCentre, setSelectedCentre] = useState<ProcurementCentre | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    setUsers(db.getCollection<User>('users'));
    setCentres(db.getCollection<ProcurementCentre>('procurement_centres'));
  };

  useEffect(() => {
    loadData();
    const unsubUsers = db.subscribe('table:users', loadData);
    const unsubCentres = db.subscribe('table:procurement_centres', loadData);
    return () => {
      unsubUsers();
      unsubCentres();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter only procurement officers / Mandi Incharges
  const procurementOfficers = users.filter((u) => u.role === 'procurement_officer');

  const getLinkedCentre = (centreId?: string) => {
    if (!centreId) return centres[0] || null;
    return centres.find((c) => c.id === centreId) || centres[0] || null;
  };

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
    showToast(`Mandi Incharge status updated to ${newApproval.toUpperCase()}`);
  };

  const districts = Array.from(new Set(centres.map((c) => c.district))).filter(Boolean);

  const filteredOfficers = procurementOfficers.filter((u) => {
    const linkedCentre = getLinkedCentre(u.centre_id);
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search) ||
      (linkedCentre && linkedCentre.name.toLowerCase().includes(search.toLowerCase())) ||
      (linkedCentre && linkedCentre.code.toLowerCase().includes(search.toLowerCase())) ||
      (linkedCentre && linkedCentre.district.toLowerCase().includes(search.toLowerCase()));

    const matchesDistrict = districtFilter === 'all' || (linkedCentre && linkedCentre.district === districtFilter);
    const matchesStatus = statusFilter === 'all' || u.approval_status === statusFilter;

    return matchesSearch && matchesDistrict && matchesStatus;
  });

  const approvedCount = procurementOfficers.filter((u) => u.approval_status === 'approved').length;
  const pendingCount = procurementOfficers.filter((u) => u.approval_status === 'pending').length;
  const totalCapacity = centres.reduce((acc, c) => acc + (c.capacity_tonnes_per_day || 0), 0);

  const handleExportCsv = () => {
    const headers = ['Officer ID,Officer Name,Role,Email,Phone,Assigned Mandi Complex,Mandi Code,District,Daily Capacity (MT),Approval Status,Account Status'];
    const rows = filteredOfficers.map((u) => {
      const c = getLinkedCentre(u.centre_id);
      return `"${u.id}","${u.name}","Procurement Officer / Mandi Incharge","${u.email}","${u.phone}","${c ? c.name : 'Unassigned'}","${c ? c.code : 'N/A'}","${c ? c.district : 'N/A'}","${c ? c.capacity_tonnes_per_day : 0} MT","${u.approval_status}","${u.account_status}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mandi_incharges_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Mandi Incharges list exported to CSV');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/40 flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/80 border border-teal-500/30 text-teal-300 text-[11px] font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>Mandi Yard Incharges & Digital Weighbridge Terminals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Mandi Incharges & Procurement Officers
          </h1>
          <p className="text-xs text-teal-200/80 max-w-2xl">
            Directory of registered Mandi Incharges and Procurement Officers managing official weighbridge operations, moisture QA, and PFMS gate passes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition-all cursor-pointer"
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
            Registered Mandi Incharges
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
            {procurementOfficers.length}
          </span>
          <span className="text-[10px] text-teal-600 font-semibold block mt-0.5">
            Procurement Officers on duty
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Approved Incharges
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 block">
            {approvedCount}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
            Authorized for gate pass issue
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
            Require verification
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Daily Intake Capacity
          </span>
          <span className="text-2xl sm:text-3xl font-black text-purple-600 mt-1 block">
            {totalCapacity.toLocaleString()} MT
          </span>
          <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">
            Across {centres.length} Mandi Yards
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incharge name, mandi, code, district, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 transition-all"
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

      {/* Officers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200/80">
              <tr>
                <th className="py-4 px-4">Mandi Incharge Details</th>
                <th className="py-4 px-4">Assigned Mandi Yard</th>
                <th className="py-4 px-4">Mandi Code</th>
                <th className="py-4 px-4">Daily Yard Capacity</th>
                <th className="py-4 px-4">Live Queue Status</th>
                <th className="py-4 px-4">Approval Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOfficers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No Mandi Incharges found</p>
                    <p className="text-[11px]">No registered procurement personnel match your search criteria</p>
                  </td>
                </tr>
              ) : (
                filteredOfficers.map((officer) => {
                  const centre = getLinkedCentre(officer.centre_id);
                  const isApproved = officer.approval_status === 'approved';
                  return (
                    <tr key={officer.id} className="hover:bg-teal-50/40 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            {officer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
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
                          {centre ? centre.name : 'Sambalpur Regulated Market Yard'}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {centre ? centre.address : 'Dhanupali Chowk, Sambalpur'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-700">
                        <span className="px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200">
                          {centre ? centre.code : 'PC-SBP-03'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-900 border border-purple-200">
                          {centre ? `${centre.capacity_tonnes_per_day} MT / Day` : '380 MT / Day'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          {centre ? `${centre.queue_length} Vehicles waiting` : '9 Vehicles waiting'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Avg: {centre ? centre.avg_wait_time_minutes : 25} mins
                        </span>
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
                              setSelectedCentre(centre);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
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

      {/* Officer & Mandi Details Modal */}
      {selectedOfficer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-teal-600/20">
                  {selectedOfficer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedOfficer.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Mandi Incharge / Procurement Officer • User ID: {selectedOfficer.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedOfficer(null);
                  setSelectedCentre(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Phone</span>
                <p className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  {selectedOfficer.phone}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Official Email</span>
                <p className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-600" />
                  {selectedOfficer.email}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Mandi Complex</span>
                <p className="font-extrabold text-sm text-teal-950">
                  {selectedCentre ? selectedCentre.name : 'Sambalpur Regulated Market Yard'} ({selectedCentre ? selectedCentre.code : 'PC-SBP-03'})
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Address: {selectedCentre ? selectedCentre.address : 'Dhanupali Chowk, Sambalpur, Odisha'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Daily Intake Capacity</span>
                <p className="font-extrabold text-sm text-purple-700">
                  {selectedCentre ? `${selectedCentre.capacity_tonnes_per_day} MT / Day` : '380 MT / Day'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Operating Hours</span>
                <p className="font-extrabold text-sm text-slate-900">
                  {selectedCentre ? selectedCentre.operating_hours : '08:30 AM - 05:30 PM'}
                </p>
              </div>
            </div>

            {/* Officer Status Control Panel */}
            <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-teal-950">Mandi Authority Clearance</h4>
                  <p className="text-[11px] text-teal-800">
                    Current Approval: <b className="uppercase">{selectedOfficer.approval_status}</b>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateOfficerStatus(selectedOfficer.id, 'approved', 'active')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                  >
                    Authorize Mandi Incharge ✓
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
                <span>Call Incharge</span>
              </a>
              <button
                onClick={() => {
                  setSelectedOfficer(null);
                  setSelectedCentre(null);
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
