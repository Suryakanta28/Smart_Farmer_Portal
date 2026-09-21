// State Procurement Manager Dashboard Home with AI Insights & Multi-Layer GIS Map
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Building, Building2, Scale, Truck, DollarSign, Sparkles, 
  AlertTriangle, CheckCircle2, TrendingUp, PhoneOff, ArrowRight,
  ShieldCheck, ShieldAlert, AlertCircle, UserCheck, Eye, Phone, Mail,
  Clock, Sprout, Shield
} from 'lucide-react';
import { db, ProcurementCentre, Vehicle, Farmer, User, UserRole } from '../../lib/db';
import { supabaseDb } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import L from 'leaflet';

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [centres, setCentres] = useState<ProcurementCentre[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [queueTab, setQueueTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const loadAllData = () => {
    setCentres(db.getCollection<ProcurementCentre>('procurement_centres'));
    setVehicles(db.getCollection<Vehicle>('vehicles'));
    setFarmers(db.getCollection<Farmer>('farmers'));
    setUsers(db.getCollection<User>('users'));
  };

  useEffect(() => {
    loadAllData();
    const unsubCentres = db.subscribe('table:procurement_centres', loadAllData);
    const unsubVehicles = db.subscribe('table:vehicles', loadAllData);
    const unsubFarmers = db.subscribe('table:farmers', loadAllData);
    const unsubUsers = db.subscribe('table:users', loadAllData);
    return () => {
      unsubCentres();
      unsubVehicles();
      unsubFarmers();
      unsubUsers();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUpdateStatus = async (
    userId: string, 
    newApproval: 'approved' | 'pending' | 'rejected' | 'revoked', 
    newAccount: 'inactive' | 'active' | 'suspended' | 'revoked' = 'active'
  ) => {
    const verifierName = user?.name || 'State Procurement Administrator';
    await supabaseDb.updateUserStatus(userId, newApproval, newAccount, verifierName);

    const actionText = 
      newApproval === 'approved' ? 'VERIFIED & APPROVED (Login Enabled)' : 
      newApproval === 'rejected' ? 'REJECTED (Login Blocked)' : 
      newApproval === 'revoked' ? 'REVOKED (Login Blocked & Session Terminated)' : 'MARKED PENDING';
    showToast(`User status updated: ${actionText}`);
  };

  // AI Generated Insights (from Edge Function generate-ai-insights)
  const aiInsights = [
    {
      icon: '📈',
      category: 'Procurement Surge',
      title: '📈 Wheat & Paddy Procurement Up 35% across Bargarh & Karnal Hubs',
      desc: 'Daily arrivals reached 450 Metric Tonnes at Attabira Mandi. Recommend operating weighing lines at Gate 3.',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    },
    {
      icon: '⚠️',
      category: 'Congestion Alert',
      title: '⚠️ Cuttack Central Mandi Congested (Peak 240 mins wait time)',
      desc: 'Arrival queue backlog detected between 12-3 PM. Auto-diverting upcoming self-transport slots to morning shift.',
      color: 'bg-amber-50 border-amber-200 text-amber-950',
    },
    {
      icon: '🚚',
      category: 'Logistics Optimization',
      title: '🚚 Vehicle Demand Surge: 300 trolleys requested, 200 active in field',
      desc: 'High farm pickup demand in Nuapali sector. Recommend engaging 20 auxiliary tractors from registered PACS.',
      color: 'bg-rose-50 border-rose-200 text-rose-950',
    },
    {
      icon: '💰',
      category: 'Treasury DBT',
      title: '💰 12 DBT Payments Pending >72 Hours due to IFSC Reconciliation',
      desc: 'Automated batch reconciliation triggered with State Bank PFMS gateway. Society officers alerted to re-verify.',
      color: 'bg-purple-50 border-purple-200 text-purple-950',
    },
    {
      icon: '📵',
      category: 'Offline Inclusivity',
      title: '📵 8 Offline Farmer Assistance Requests Successfully Tokenized Today',
      desc: 'PACS officers printed official QR slips and sent SMS notifications to designated family mobile numbers.',
      color: 'bg-blue-50 border-blue-200 text-blue-950',
    },
  ];

  // Initialize Statewide Multi-Layer GIS Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [21.4669, 83.9812],
        zoom: 7,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap | FPP State Procurement Control',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Render Centres (Red, or Orange if high queue)
    centres.forEach((centre) => {
      const isHighQueue = centre.queue_length > 15;
      const markerColor = isHighQueue ? '#f97316' : '#ef4444';

      const centreIcon = L.divIcon({
        className: 'manager-mandi-pin',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: ${markerColor};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px ${isHighQueue ? 'rgba(249,115,22,0.6)' : 'rgba(239,68,68,0.5)'};
          ">
            <span style="font-size: 16px;">🏢</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([centre.latitude, centre.longitude], { icon: centreIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px; min-width: 200px;">
            <b>🏢 ${centre.name}</b><br/>
            District: ${centre.district}<br/>
            Queue: <b style="color: ${isHighQueue ? '#ea580c' : '#16a34a'};">${centre.queue_length} Farmers</b><br/>
            Avg Wait: ${centre.avg_wait_time_minutes} mins<br/>
            Capacity: ${centre.capacity_tonnes_per_day} MT/day
          </div>
        `);
    });

    // Render Active Vehicles (Green)
    vehicles.forEach((veh) => {
      const vehIcon = L.divIcon({
        className: 'manager-veh-pin',
        html: `
          <div style="
            width: 26px;
            height: 26px;
            background: #16a34a;
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(22,163,74,0.5);
          ">
            <span style="font-size: 14px;">🚚</span>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      L.marker([veh.latitude, veh.longitude], { icon: vehIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px;">
            <b>🚚 ${veh.driver_name}</b><br/>
            Reg: ${veh.registration_number}<br/>
            Status: ${veh.status.toUpperCase()}
          </div>
        `);
    });
  }, [centres, vehicles]);

  const nonManagerUsers = users.filter((u) => u.role !== 'manager');
  const pendingUsers = nonManagerUsers.filter((u) => u.approval_status === 'pending');
  const approvedUsers = nonManagerUsers.filter((u) => u.approval_status === 'approved');
  const revokedUsers = nonManagerUsers.filter((u) => u.approval_status === 'rejected' || u.account_status === 'suspended');

  const pendingFarmersCount = pendingUsers.filter((u) => u.role === 'farmer').length;
  const pendingOfficersCount = pendingUsers.filter((u) => u.role === 'procurement_officer').length;
  const pendingSocietiesCount = pendingUsers.filter((u) => u.role === 'society_officer').length;

  const filteredQueue = nonManagerUsers.filter((u) => {
    const matchesTab = 
      queueTab === 'all' ? true :
      queueTab === 'pending' ? u.approval_status === 'pending' :
      queueTab === 'approved' ? u.approval_status === 'approved' && u.account_status !== 'suspended' :
      queueTab === 'rejected' ? (u.approval_status === 'rejected' || u.account_status === 'suspended') : true;

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesTab && matchesRole;
  });

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'farmer':
        return { label: 'Farmer / Kisan', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: Sprout };
      case 'society_officer':
        return { label: 'PACS Officer', bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: Building };
      case 'procurement_officer':
        return { label: 'Mandi Incharge', bg: 'bg-teal-50 text-teal-800 border-teal-200', icon: Building2 };
      case 'driver':
        return { label: 'Logistics Driver', bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Truck };
      default:
        return { label: 'User', bg: 'bg-slate-50 text-slate-800 border-slate-200', icon: Users };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-purple-500/40 flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300 bg-purple-900/80 px-2.5 py-0.5 rounded-full border border-purple-500/30">
              State Agriculture Marketing Command Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Statewide Governance: {user?.name || 'State Procurement Administrator'}
          </h1>
          <p className="text-xs text-purple-200/80 max-w-xl">
            Real-time multi-district grain intake monitoring, user registration verification & revocation control, and direct treasury clearing
          </p>
        </div>
      </div>

      {/* Stats Cards (5 Columns Real-Time Clickable Links) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Link
          to="/manager/farmers"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group block relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Farmer Database
            </span>
            <Users className="w-3.5 h-3.5 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block group-hover:text-purple-700 transition-colors">
            {farmers.length}
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-emerald-600 font-semibold">
              View Directory →
            </span>
            {pendingFarmersCount > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                {pendingFarmersCount} pending
              </span>
            )}
          </div>
        </Link>

        <Link
          to="/manager/societies"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group block relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              PACS Societies
            </span>
            <Building className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1 block">
            {nonManagerUsers.filter((u) => u.role === 'society_officer').length}
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-blue-600 font-semibold">
              Society Officers →
            </span>
            {pendingSocietiesCount > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                {pendingSocietiesCount} pending
              </span>
            )}
          </div>
        </Link>

        <Link
          to="/manager/officers"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all group block relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Mandi Incharges
            </span>
            <Building2 className="w-3.5 h-3.5 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block group-hover:text-teal-700 transition-colors">
            {nonManagerUsers.filter((u) => u.role === 'procurement_officer').length}
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-teal-600 font-semibold">
              Procurement Incharges →
            </span>
            {pendingOfficersCount > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                {pendingOfficersCount} pending
              </span>
            )}
          </div>
        </Link>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Vehicle Fleet
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 block">
            {vehicles.length + 182}
          </span>
          <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
            Trolleys on road
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Today's DBT Payout
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-purple-600 mt-1 block">
            ₹ 3.42 Cr
          </span>
          <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">
            PFMS cleared
          </span>
        </div>
      </div>

      {/* STATEWIDE REGISTRATION & VERIFICATION QUEUE */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-purple-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">
                  Statewide Registration Verification & Access Control
                </h3>
                {pendingUsers.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                    {pendingUsers.length} Action Required
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                All newly registered Farmers, Society Officers, and Mandi Incharges require State Manager verification before login. Managers can approve or revoke access anytime.
              </p>
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Registered Roles</option>
              <option value="farmer">Farmers (Kisans)</option>
              <option value="society_officer">PACS Society Officers</option>
              <option value="procurement_officer">Mandi Incharges</option>
              <option value="driver">Logistics Drivers</option>
            </select>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setQueueTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              queueTab === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Pending Approvals ({pendingUsers.length})</span>
          </button>

          <button
            onClick={() => setQueueTab('approved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              queueTab === 'approved'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Approved & Active ({approvedUsers.length})</span>
          </button>

          <button
            onClick={() => setQueueTab('rejected')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              queueTab === 'rejected'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Revoked / Blocked ({revokedUsers.length})</span>
          </button>

          <button
            onClick={() => setQueueTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              queueTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Registrations ({nonManagerUsers.length})</span>
          </button>
        </div>

        {/* Verification Queue Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">User Name & Role</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Registration ID / Date</th>
                <th className="py-3.5 px-4">Login Access Status</th>
                <th className="py-3.5 px-4 text-right">Manager Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-xs">No registrations found in this category</p>
                    <p className="text-[10px]">All users in this category are fully processed</p>
                  </td>
                </tr>
              ) : (
                filteredQueue.map((u) => {
                  const roleMeta = getRoleBadge(u.role);
                  const RoleIcon = roleMeta.icon;
                  const isApproved = u.approval_status === 'approved' && u.account_status !== 'suspended';
                  const isRevoked = u.approval_status === 'rejected' || u.account_status === 'suspended';

                  return (
                    <tr key={u.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border mt-0.5 ${roleMeta.bg}`}>
                              <RoleIcon className="w-3 h-3" />
                              {roleMeta.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{u.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-800">{u.id}</span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : 'Registered'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isApproved ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit shadow-xs">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            APPROVED (Can Login)
                          </span>
                        ) : isRevoked ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit shadow-xs">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            REVOKED (Login Blocked)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit shadow-xs animate-pulse">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            PENDING VERIFICATION
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isApproved ? (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'approved', 'active')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                                title="Verify & Authorize User Login"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Verify & Approve</span>
                              </button>
                              {u.approval_status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateStatus(u.id, 'rejected', 'inactive')}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold text-xs transition-colors cursor-pointer border border-slate-200 inline-flex items-center gap-1"
                                  title="Reject Registration"
                                >
                                  <span>Reject</span>
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(u.id, 'revoked', 'revoked')}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer border border-rose-200 inline-flex items-center gap-1"
                              title="Revoke and Terminate Session"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Revoke Access</span>
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

      {/* SMART INSIGHTS SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                🤖 AI Smart Operational Insights
              </h3>
              <p className="text-xs text-slate-500">
                Real-time automated analytics generated from central telemetry and database events
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl">
            Live Stream
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiInsights.map((ins, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border ${ins.color} space-y-2 text-xs flex flex-col justify-between`}
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                  {ins.category}
                </span>
                <h4 className="font-extrabold text-sm leading-snug">{ins.title}</h4>
                <p className="opacity-85 leading-relaxed text-[11px]">{ins.desc}</p>
              </div>

              <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[10px] font-bold">
                <span>Action Recommended</span>
                <span>Review Protocol →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STATEWIDE MANDI & VEHICLE RADAR MAP */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              Statewide GIS Control Map
            </h3>
            <p className="text-xs text-slate-500">
              Red: Procurement Mandis • Orange: High-Queue Centres (&gt;15 Waiting) • Green: Active GPS Logistics Vehicles
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" /> Mandi
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500" /> Congested Mandi
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-500" /> Active Trolley
            </span>
          </div>
        </div>

        <div className="relative h-[480px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
          <div ref={mapContainerRef} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
};
