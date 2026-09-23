// Manager Portal: Pending Registration Approvals & Authorization Command
// KRISHIFLOW-AI - Smart Farmer Procurement Platform (SIH 2026)

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Users, Building2, Sprout, ShieldCheck, ShieldAlert, 
  CheckCircle2, XCircle, Clock, Search, Filter, RefreshCw, Eye, 
  Phone, Mail, MapPin, Building, FileText, Check, X, AlertTriangle, 
  Sparkles, Send, ArrowUpDown, ChevronRight, Shield
} from 'lucide-react';
import { db, RegistrationRequest, Society, ProcurementCentre, User } from '../../lib/db';
import { supabaseDb } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const ManagerPendingApprovalsPage: React.FC = () => {
  const { user: currentManager } = useAuth();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [centres, setCentres] = useState<ProcurementCentre[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusTab, setStatusTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [roleFilter, setRoleFilter] = useState<'all' | 'farmer' | 'society_officer' | 'procurement_officer'>('all');
  
  // Modals & Action States
  const [selectedReq, setSelectedReq] = useState<RegistrationRequest | null>(null);
  const [rejectingReq, setRejectingReq] = useState<RegistrationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await supabaseDb.getRegistrationRequests();
    setRequests(data);
    setSocieties(db.getCollection<Society>('societies'));
    setCentres(db.getCollection<ProcurementCentre>('centres'));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe('table:registration_requests', () => {
      loadData();
    });
    return () => unsub();
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleApprove = async (req: RegistrationRequest) => {
    setActionLoading(true);
    const managerId = currentManager?.id || 'usr-manager-01';
    const managerName = currentManager?.name || 'Dr. Alok Ranjan Rath (IAS)';

    const res = await supabaseDb.approveRegistrationRequest(req.id, managerId, managerName);
    setActionLoading(false);

    if (res.success) {
      showToast('success', `✅ Approved & Provisioned: ${req.full_name} (${req.role.replace('_', ' ')}) has been approved! Official account created in database.`);
      loadData();
      if (selectedReq?.id === req.id) setSelectedReq(null);
    } else {
      showToast('error', `Approval failed: ${res.error || 'Unknown error'}`);
    }
  };

  const handleReject = async () => {
    if (!rejectingReq) return;
    if (!rejectionReason.trim()) {
      showToast('error', 'Mandatory: Please provide a reason for rejecting this registration.');
      return;
    }

    setActionLoading(true);
    const managerId = currentManager?.id || 'usr-manager-01';
    const managerName = currentManager?.name || 'Dr. Alok Ranjan Rath (IAS)';

    const res = await supabaseDb.rejectRegistrationRequest(rejectingReq.id, rejectionReason, managerId, managerName);
    setActionLoading(false);

    if (res.success) {
      showToast('info', `❌ Registration Rejected: ${rejectingReq.full_name}'s request marked as rejected with reason.`);
      setRejectingReq(null);
      setRejectionReason('');
      loadData();
      if (selectedReq?.id === rejectingReq.id) setSelectedReq(null);
    } else {
      showToast('error', `Rejection failed: ${res.error || 'Unknown error'}`);
    }
  };

  const getSocietyName = (id?: string) => {
    if (!id) return 'Not Specified';
    const s = societies.find((item) => item.id === id || item.code === id || (item.id && id && item.id.toLowerCase() === id.toLowerCase()));
    return s ? s.name : 'Sambalpur Central PAC Society';
  };

  const getCentreName = (id?: string) => {
    if (!id) return 'Not Specified';
    const c = centres.find((item) => item.id === id || item.code === id);
    return c ? c.name : 'Sambalpur Regulated Market Yard';
  };

  // Filtered list
  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusTab === 'all' || r.status === statusTab;
    const matchesRole = roleFilter === 'all' || r.role === roleFilter;
    const cleanSearch = search.toLowerCase().trim();
    const matchesSearch = 
      !cleanSearch ||
      r.full_name.toLowerCase().includes(cleanSearch) ||
      r.mobile_number.includes(cleanSearch) ||
      (r.email && r.email.toLowerCase().includes(cleanSearch)) ||
      (r.district && r.district.toLowerCase().includes(cleanSearch)) ||
      (r.village && r.village.toLowerCase().includes(cleanSearch));

    return matchesStatus && matchesRole && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const roleCounts = {
    farmer: requests.filter((r) => r.status === 'pending' && r.role === 'farmer').length,
    society_officer: requests.filter((r) => r.status === 'pending' && r.role === 'society_officer').length,
    procurement_officer: requests.filter((r) => r.status === 'pending' && r.role === 'procurement_officer').length,
  };

  const commonReasons = [
    'Land parcel record mismatch with Bhulekh revenue records',
    'Aadhaar document photo unclear or masked digits invalid',
    'Invalid IFSC code or bank account verification failed',
    'PACS Society authorization document not uploaded',
    'Procurement Centre jurisdiction assignment invalid',
    'Duplicate applicant record with identical mobile/Aadhaar',
  ];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-4 max-w-md ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900/95 text-white border-emerald-500 shadow-emerald-900/40'
              : toastMessage.type === 'error'
              ? 'bg-rose-900/95 text-white border-rose-500 shadow-rose-900/40'
              : 'bg-slate-900/95 text-white border-slate-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-300" />
                State Administrative Clearance HQ
              </span>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
                  {pendingCount} Action Required
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Registration Approvals & KYC Verification
            </h1>
            <p className="text-xs sm:text-sm text-purple-200 max-w-2xl leading-relaxed">
              Real-time authorization gate for new Farmers, PACS Society Officers, and Mandi Procurement Incharges. No account is permitted login access until cleared here.
            </p>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
              <span className="block text-2xl font-black text-amber-300">{pendingCount}</span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Pending</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
              <span className="block text-2xl font-black text-emerald-300">{approvedCount}</span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Approved</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
              <span className="block text-2xl font-black text-rose-300">{rejectedCount}</span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Rejected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs, Filters, and Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setStatusTab('pending')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              statusTab === 'pending'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Approvals ({pendingCount})</span>
          </button>
          <button
            onClick={() => setStatusTab('approved')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              statusTab === 'approved'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved Accounts ({approvedCount})</span>
          </button>
          <button
            onClick={() => setStatusTab('rejected')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              statusTab === 'rejected'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected ({rejectedCount})</span>
          </button>
          <button
            onClick={() => setStatusTab('all')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>All Submissions ({requests.length})</span>
          </button>
        </div>

        {/* Role Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Role Dropdown */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 text-slate-700 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All Roles</option>
              <option value="farmer">🌾 Farmers ({roleCounts.farmer})</option>
              <option value="society_officer">👥 PACS Officers ({roleCounts.society_officer})</option>
              <option value="procurement_officer">🏢 Mandi Incharges ({roleCounts.procurement_officer})</option>
            </select>
          </div>

          {/* Search Field */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, mobile, village..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={loadData}
            title="Refresh database"
            className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors border border-slate-200 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Requests Table / Cards View */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <UserCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Registration Requests Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {statusTab === 'pending'
              ? 'All clear! There are currently no pending registration requests awaiting manager verification.'
              : `No requests found for filter "${statusTab}" / "${roleFilter}".`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3.5 px-4">Applicant & Role</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Role-Specific Details</th>
                  <th className="py-3.5 px-4">Requested At</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => {
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  const isRejected = req.status === 'rejected';

                  const RoleIcon = 
                    req.role === 'farmer' ? Sprout :
                    req.role === 'society_officer' ? Users :
                    req.role === 'procurement_officer' ? Building2 : Shield;

                  const roleColor = 
                    req.role === 'farmer' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    req.role === 'society_officer' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-purple-50 text-purple-700 border-purple-200';

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Applicant & Role */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {req.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-sm">{req.full_name}</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${roleColor}`}>
                              <RoleIcon className="w-3 h-3" />
                              <span className="capitalize">{req.role.replace('_', ' ')}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-4 px-4 text-slate-600">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>+91 {req.mobile_number.slice(-10)}</span>
                          </div>
                          {req.email && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[150px]">{req.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Role Specific Details */}
                      <td className="py-4 px-4 text-slate-600">
                        {req.role === 'farmer' && (
                          <div className="space-y-0.5 text-[11px]">
                            <p>
                              <span className="font-semibold text-slate-700">Land:</span>{' '}
                              <span className="font-bold text-emerald-700">{req.land_area_hectares || 1.5} Hectares</span>
                            </p>
                            <p className="text-slate-500">
                              <span className="font-semibold">Village:</span> {req.village || 'N/A'}, {req.district || 'Sambalpur'}
                            </p>
                            <p className="text-slate-400 text-[10px]">
                              Aadhaar: {req.aadhaar_masked || 'XXXX-XXXX-9988'}
                            </p>
                          </div>
                        )}

                        {req.role === 'society_officer' && (
                          <div className="space-y-0.5 text-[11px]">
                            <p className="font-bold text-slate-900">
                              {getSocietyName(req.society_id)}
                            </p>
                            <p className="text-slate-500">
                              Designation: {req.designation || 'PACS Secretary / Incharge'}
                            </p>
                          </div>
                        )}

                        {req.role === 'procurement_officer' && (
                          <div className="space-y-0.5 text-[11px]">
                            <p className="font-bold text-slate-900">
                              {getCentreName(req.centre_id)}
                            </p>
                            <p className="text-slate-500">
                              Designation: {req.designation || 'Mandi Inspector / Incharge'}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Requested At */}
                      <td className="py-4 px-4 text-slate-500 text-[11px]">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800">
                            {new Date(req.requested_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(req.requested_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600 animate-spin" style={{ animationDuration: '3s' }} />
                            <span>Pending Review</span>
                          </span>
                        )}
                        {isApproved && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Approved</span>
                            </span>
                            {req.reviewed_by_name && (
                              <p className="text-[9px] text-slate-400">by {req.reviewed_by_name}</p>
                            )}
                          </div>
                        )}
                        {isRejected && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Rejected</span>
                            </span>
                            {req.rejection_reason && (
                              <p className="text-[10px] text-rose-600 max-w-[150px] truncate" title={req.rejection_reason}>
                                {req.rejection_reason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReq(req)}
                            title="Inspect Details"
                            className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(req)}
                                disabled={actionLoading}
                                title="Approve and create user account"
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 text-[11px]"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>

                              <button
                                onClick={() => {
                                  setRejectingReq(req);
                                  setRejectionReason('');
                                }}
                                disabled={actionLoading}
                                title="Reject registration"
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 text-[11px]"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </span>
                          )}

                          {isRejected && (
                            <button
                              onClick={() => handleApprove(req)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 text-[10px] font-bold rounded-lg border border-slate-200 cursor-pointer"
                            >
                              Re-Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Request Details Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xl">
                  {selectedReq.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{selectedReq.full_name}</h3>
                  <span className="inline-block text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 uppercase">
                    {selectedReq.role.replace('_', ' ')} Application
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Mobile Number</span>
                <span className="font-bold text-slate-800">+91 {selectedReq.mobile_number}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Email Address</span>
                <span className="font-bold text-slate-800">{selectedReq.email || 'None Provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Submission Date</span>
                <span className="font-bold text-slate-800">{new Date(selectedReq.requested_at).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Status</span>
                <span className={`font-bold uppercase ${selectedReq.status === 'approved' ? 'text-emerald-600' : selectedReq.status === 'rejected' ? 'text-rose-600' : 'text-amber-600'}`}>
                  {selectedReq.status}
                </span>
              </div>

              {selectedReq.role === 'farmer' && (
                <>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Land Area</span>
                    <span className="font-bold text-emerald-700">{selectedReq.land_area_hectares || 2.0} Hectares</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Aadhaar (Masked)</span>
                    <span className="font-bold text-slate-800">{selectedReq.aadhaar_masked || 'XXXX-XXXX-9988'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Village / District</span>
                    <span className="font-bold text-slate-800">{selectedReq.village || 'N/A'}, {selectedReq.district || 'Sambalpur'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Bank IFSC Code</span>
                    <span className="font-bold text-slate-800">{selectedReq.ifsc_code || 'SBIN0001234'}</span>
                  </div>
                </>
              )}

              {selectedReq.role === 'society_officer' && (
                <div className="col-span-2">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned PACS Society</span>
                  <span className="font-bold text-slate-800">{getSocietyName(selectedReq.society_id)}</span>
                </div>
              )}

              {selectedReq.role === 'procurement_officer' && (
                <div className="col-span-2">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Mandi Complex</span>
                  <span className="font-bold text-slate-800">{getCentreName(selectedReq.centre_id)}</span>
                </div>
              )}

              {selectedReq.rejection_reason && (
                <div className="col-span-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                  <span className="font-bold block text-[10px] uppercase">Rejection Reason:</span>
                  <span>{selectedReq.rejection_reason}</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              {selectedReq.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setRejectingReq(selectedReq);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleApprove(selectedReq)}
                    disabled={actionLoading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    Approve & Grant Login Access
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Rejection Reason Modal */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Reject Registration Application
                </h3>
              </div>
              <button
                onClick={() => setRejectingReq(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please enter the official rejection reason for <b className="text-slate-900">{rejectingReq.full_name}</b> ({rejectingReq.role.replace('_', ' ')}). This reason will be displayed to the user when they attempt to login.
            </p>

            {/* Quick Pick Reasons */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Quick Reason Suggestions:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {commonReasons.map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(reason)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-800 text-slate-600 transition-colors text-left cursor-pointer"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Rejection Text Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Official Rejection Reason * (Mandatory)
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Land area mismatch with state Bhulekh registry or incomplete Aadhaar verification..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingReq(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ManagerPendingApprovalsPage;
