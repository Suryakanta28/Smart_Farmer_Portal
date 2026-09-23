// Registered Farmers Directory & Pending PACS Approvals Command
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, Search, ShieldCheck, Phone, MapPin, Eye, CheckCircle2, 
  XCircle, Clock, AlertTriangle, Building, Sprout, Landmark, 
  RefreshCw, FileText, Check, X, ShieldAlert, Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, Farmer, User, RegistrationRequest, Society, ProcurementCentre } from '../../lib/db';
import { supabaseDb, matchesSociety, resolveSocietyUUID } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const FarmersListPage: React.FC = () => {
  const { user: currentOfficer } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'pending' | 'verified' | 'history') || 'pending';

  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'history'>(initialTab);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [centres, setCentres] = useState<ProcurementCentre[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  
  // Action Modals & States
  const [selectedReq, setSelectedReq] = useState<RegistrationRequest | null>(null);
  const [rejectingReq, setRejectingReq] = useState<RegistrationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const officerSocietyId = currentOfficer?.society_id || '11111111-1111-1111-1111-111111111101';

  const loadAllData = async () => {
    setLoading(true);
    // 1. Fetch live registration requests from Supabase
    const allReqs = await supabaseDb.getRegistrationRequests();
    setRequests(allReqs.filter((r) => r.role === 'farmer'));

    // 2. Fetch local/remote societies & centres
    setSocieties(db.getCollection<Society>('societies'));
    setCentres(db.getCollection<ProcurementCentre>('centres'));

    // 3. Fetch verified farmers
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
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
    const unsubReq = db.subscribe('table:registration_requests', loadAllData);
    const unsubFarmers = db.subscribe('table:farmers', loadAllData);
    return () => {
      unsubReq();
      unsubFarmers();
    };
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as 'pending' | 'verified' | 'history';
    if (tabParam && ['pending', 'verified', 'history'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'pending' | 'verified' | 'history') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Filter requests for THIS Society Officer's jurisdiction
  const societyRequests = requests.filter((r) => {
    return matchesSociety(r.society_id, officerSocietyId);
  });

  const pendingRequests = societyRequests.filter((r) => r.status === 'pending');
  const historyRequests = societyRequests.filter((r) => r.status === 'approved' || r.status === 'rejected');

  // Handle Approve by Society Officer
  const handleApprove = async (req: RegistrationRequest) => {
    setActionLoading(true);
    const officerId = currentOfficer?.id || '00000000-0000-0000-0000-000000000003';
    const officerName = `${currentOfficer?.name || 'Society Officer'} (PACS Officer)`;

    const res = await supabaseDb.approveRegistrationRequest(req.id, officerId, officerName);
    setActionLoading(false);

    if (res.success) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      showToast('success', `✅ Farmer Approved: ${req.full_name} has been verified and activated! They can now log in immediately.`);
      loadAllData();
      if (selectedReq?.id === req.id) setSelectedReq(null);
    } else {
      showToast('error', `Approval failed: ${res.error || 'Unknown error'}`);
    }
  };

  // Handle Reject by Society Officer
  const handleReject = async () => {
    if (!rejectingReq) return;
    if (!rejectionReason.trim()) {
      showToast('error', 'Mandatory: Please provide a valid reason for rejecting this farmer registration.');
      return;
    }

    setActionLoading(true);
    const officerId = currentOfficer?.id || '00000000-0000-0000-0000-000000000003';
    const officerName = `${currentOfficer?.name || 'Society Officer'} (PACS Officer)`;

    const res = await supabaseDb.rejectRegistrationRequest(rejectingReq.id, rejectionReason, officerId, officerName);
    setActionLoading(false);

    if (res.success) {
      showToast('info', `❌ Farmer Rejected: ${rejectingReq.full_name}'s registration marked as rejected.`);
      setRejectingReq(null);
      setRejectionReason('');
      loadAllData();
      if (selectedReq?.id === rejectingReq.id) setSelectedReq(null);
    } else {
      showToast('error', `Rejection failed: ${res.error || 'Unknown error'}`);
    }
  };

  const getSocietyName = (id?: string) => {
    if (!id) return 'Sambalpur Central PACS';
    const s = societies.find((item) => item.id === id || item.code === id || resolveSocietyUUID(item.id) === resolveSocietyUUID(id));
    return s ? s.name : 'Sambalpur Central PAC Society';
  };

  const getCentreName = (id?: string) => {
    if (!id) return 'Sambalpur Regulated Mandi';
    const c = centres.find((item) => item.id === id || item.code === id);
    return c ? c.name : 'Sambalpur Regulated Mandi';
  };

  // Search filtering
  const filteredPending = pendingRequests.filter(
    (r) =>
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.mobile_number.includes(search) ||
      (r.village && r.village.toLowerCase().includes(search.toLowerCase())) ||
      (r.aadhaar_masked && r.aadhaar_masked.includes(search))
  );

  const filteredFarmers = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.village && f.village.toLowerCase().includes(search.toLowerCase())) ||
      f.aadhaar_masked.includes(search) ||
      (f.alternate_contact_phone && f.alternate_contact_phone.includes(search))
  );

  const filteredHistory = historyRequests.filter(
    (r) =>
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.mobile_number.includes(search) ||
      (r.village && r.village.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold transition-all transform animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toastMessage.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/80 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Building className="w-3.5 h-3.5" />
              <span>{getSocietyName(officerSocietyId)}</span>
            </span>
            <button
              onClick={loadAllData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Live DB</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            PACS Farmer Enrollment & Verification Desk
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
            Review incoming farmer registrations for your PACS jurisdiction. Authorized approvals instantly update Supabase tables, grant farmer login access, and automatically reflect in the State Manager master list.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => handleTabChange('pending')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approvals</span>
          {pendingRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white animate-pulse">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('verified')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'verified'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verified Society Roster</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {farmers.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Registration History</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {historyRequests.length}
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by farmer name, mobile number, village, Aadhaar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold self-end sm:self-auto">
          Showing {activeTab === 'pending' ? filteredPending.length : activeTab === 'verified' ? filteredFarmers.length : filteredHistory.length} records
        </div>
      </div>

      {/* TAB 1: PENDING APPROVALS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {filteredPending.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">All Caught Up!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                There are currently no pending farmer registration requests waiting for verification under {getSocietyName(officerSocietyId)}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPending.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-amber-200 shadow-md p-5 flex flex-col justify-between space-y-4 hover:shadow-lg transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-slate-900">{req.full_name}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 uppercase">
                            Pending PACS Review
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-600 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{req.mobile_number}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        title="View Full Application"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl text-xs border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Village & Block</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {req.village || 'N/A'}, {req.block || 'Sadar'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Land Area</span>
                        <span className="font-bold text-emerald-700 block">
                          {req.land_area_hectares || 1.5} Hectares
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Aadhaar (Masked)</span>
                        <span className="font-mono text-slate-700 block">
                          {req.aadhaar_masked || 'XXXX-XXXX-9988'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Bank IFSC</span>
                        <span className="font-mono text-slate-700 block">
                          {req.ifsc_code || 'SBIN0001234'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Submitted: {new Date(req.requested_at).toLocaleString()}</span>
                      <span className="text-blue-600 font-semibold">{getCentreName(req.centre_id)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleApprove(req)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Farmer</span>
                    </button>
                    <button
                      onClick={() => setRejectingReq(req)}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VERIFIED ROSTER */}
      {activeTab === 'verified' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Farmer Name</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Aadhaar (Masked)</th>
                  <th className="py-3.5 px-4">Village & District</th>
                  <th className="py-3.5 px-4">Land Area</th>
                  <th className="py-3.5 px-4">Bank IFSC</th>
                  <th className="py-3.5 px-4">KYC Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFarmers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No verified farmers found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredFarmers.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{f.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{f.alternate_contact_phone || '+91-9876543210'}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{f.aadhaar_masked}</td>
                      <td className="py-3 px-4 text-slate-600">{f.village}, {f.district}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {f.land_area_hectares} Hectares
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{f.ifsc_code}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{f.kyc_status?.toUpperCase() || 'VERIFIED'}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REGISTRATION HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Applicant Name</th>
                  <th className="py-3.5 px-4">Mobile</th>
                  <th className="py-3.5 px-4">Village</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Reviewed By</th>
                  <th className="py-3.5 px-4">Reviewed At</th>
                  <th className="py-3.5 px-4">Notes / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No past registration records found for this PACS society.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{req.full_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{req.mobile_number}</td>
                      <td className="py-3 px-4 text-slate-600">{req.village || 'Odisha Rural'}</td>
                      <td className="py-3 px-4">
                        {req.status === 'approved' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>APPROVED</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" />
                            <span>REJECTED</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">{req.reviewed_by_name || 'System Auto-Verifier'}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                        {req.rejection_reason || 'Verified successfully under PACS rules.'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  Farmer Application Dossier
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1">{selectedReq.full_name}</h3>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Mobile Number</span>
                  <span className="font-bold text-slate-800">{selectedReq.mobile_number}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Aadhaar (Masked)</span>
                  <span className="font-mono text-slate-800">{selectedReq.aadhaar_masked || 'XXXX-XXXX-9988'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Village & District</span>
                  <span className="font-semibold text-slate-800">{selectedReq.village}, {selectedReq.district}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Land Area</span>
                  <span className="font-bold text-emerald-700">{selectedReq.land_area_hectares} Hectares</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Bank Account</span>
                  <span className="font-mono text-slate-800">{selectedReq.bank_account || '••••••••9842'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">IFSC Code</span>
                  <span className="font-mono text-slate-800">{selectedReq.ifsc_code}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">PACS Society</span>
                  <span className="font-semibold text-blue-800">{getSocietyName(selectedReq.society_id)}</span>
                </div>
              </div>
            </div>

            {selectedReq.status === 'pending' && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleApprove(selectedReq)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Authorize Login</span>
                </button>
                <button
                  onClick={() => {
                    const reqToReject = selectedReq;
                    setSelectedReq(null);
                    setRejectingReq(reqToReject);
                  }}
                  disabled={actionLoading}
                  className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REJECT REASON MODAL */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 border-b border-slate-100 pb-3">
              <ShieldAlert className="w-6 h-6" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Reject Farmer Registration</h3>
                <p className="text-[11px] text-slate-500">{rejectingReq.full_name} ({rejectingReq.mobile_number})</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Mandatory Rejection Reason (Dispatched via SMS to Farmer):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Land area mismatch with PACS revenue records. Please visit PACS counter with physical patta."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 min-h-[90px]"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setRejectingReq(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
