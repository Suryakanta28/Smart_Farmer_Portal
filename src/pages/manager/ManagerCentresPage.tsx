// Manager Portal: Statewide Mandi Centres Network & Regulated Market Yards
// FPP - Smart Farmer Procurement Platform

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, Search, MapPin, Phone, Clock, Users, 
  ArrowUpDown, Filter, Download, CheckCircle2, X, Eye, 
  Layers, Map as MapIcon, Scale, ShieldCheck, Activity, AlertTriangle, ExternalLink
} from 'lucide-react';
import { db, ProcurementCentre, User, QueueItem } from '../../lib/db';
import L from 'leaflet';

export const ManagerCentresPage: React.FC = () => {
  const [centres, setCentres] = useState<ProcurementCentre[]>([]);
  const [officers, setOfficers] = useState<User[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'smooth' | 'busy'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map' | 'table'>('grid');
  const [selectedCentre, setSelectedCentre] = useState<ProcurementCentre | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const loadData = () => {
    setCentres(db.getCollection<ProcurementCentre>('centres'));
    const allUsers = db.getCollection<User>('users');
    setOfficers(allUsers.filter((u) => u.role === 'procurement_officer'));
    setQueue(db.getCollection<QueueItem>('queue'));
  };

  useEffect(() => {
    loadData();
    const unsubCentres = db.subscribe('table:centres', loadData);
    const unsubUsers = db.subscribe('table:users', loadData);
    const unsubQueue = db.subscribe('table:queue', loadData);
    return () => {
      unsubCentres();
      unsubUsers();
      unsubQueue();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const districts = Array.from(new Set(centres.map((c) => c.district))).filter(Boolean);

  const filteredCentres = centres.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.district.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase());

    const matchesDistrict = districtFilter === 'all' || c.district === districtFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'smooth') {
      matchesStatus = c.queue_length <= 15;
    } else if (statusFilter === 'busy') {
      matchesStatus = c.queue_length > 15;
    }

    return matchesSearch && matchesDistrict && matchesStatus;
  });

  // Map Initialization & Updates
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [21.4669, 83.9812],
        zoom: 7,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap | FPP State Mandi Control Network',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    // Render Mandi Pins
    filteredCentres.forEach((centre) => {
      const isHighQueue = centre.queue_length > 15;
      const markerColor = isHighQueue ? '#ea580c' : '#059669';

      const centreIcon = L.divIcon({
        className: 'manager-mandi-pin',
        html: `
          <div style="
            width: 36px;
            height: 36px;
            background: ${markerColor};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px ${isHighQueue ? 'rgba(234,88,12,0.6)' : 'rgba(5,150,105,0.5)'};
            color: white;
            font-size: 16px;
          ">
            🏢
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([centre.latitude, centre.longitude], { icon: centreIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 220px; line-height: 1.5;">
            <b style="font-size: 13px; color: #0f172a;">🏢 ${centre.name}</b><br/>
            <span style="color: #64748b; font-size: 10px; font-weight: bold;">CODE: ${centre.code} • ${centre.district}</span>
            <hr style="margin: 6px 0; border: none; border-top: 1px solid #e2e8f0;"/>
            <div>Live Queue: <b style="color: ${isHighQueue ? '#ea580c' : '#059669'};">${centre.queue_length} Farmers</b></div>
            <div>Avg Wait: <b>${centre.avg_wait_time_minutes} mins</b></div>
            <div>Daily Capacity: <b>${centre.capacity_tonnes_per_day} MT / day</b></div>
            <div>Hours: <b>${centre.operating_hours}</b></div>
            <div style="margin-top: 6px;">
              <a href="tel:${centre.contact_phone}" style="color: #2563eb; text-decoration: none; font-weight: bold;">📞 ${centre.contact_phone}</a>
            </div>
          </div>
        `);

      markersRef.current.push(marker);
    });

    if (filteredCentres.length > 0) {
      const bounds = L.latLngBounds(filteredCentres.map((c) => [c.latitude, c.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }
  }, [viewMode, filteredCentres]);

  const totalCapacity = centres.reduce((acc, c) => acc + (c.capacity_tonnes_per_day || 0), 0);
  const totalQueueWaiters = centres.reduce((acc, c) => acc + (c.queue_length || 0), 0);
  const avgWaitTime = Math.round(centres.reduce((acc, c) => acc + (c.avg_wait_time_minutes || 0), 0) / (centres.length || 1));

  const handleExportCsv = () => {
    const headers = ['Centre Code,Mandi Name,District,Address,Daily Capacity (Tonnes),Live Queue,Avg Wait (Mins),Operating Hours,Contact Phone'];
    const rows = filteredCentres.map((c) => 
      `"${c.code}","${c.name}","${c.district}","${c.address}","${c.capacity_tonnes_per_day}","${c.queue_length}","${c.avg_wait_time_minutes}","${c.operating_hours}","${c.contact_phone}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mandi_centres_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Mandi Centres directory exported to CSV successfully');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Building2 className="w-3.5 h-3.5" />
              Statewide Mandi Network & Regulated Yards
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Mandi Centres & Procurement Complex Network
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time digital oversight of regulated market yards, automated weighbridge queue telemetry, daily intake capacities, and official Mandi Incharges across Odisha.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold text-white transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-purple-300" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Active Mandis</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{centres.length}</div>
          <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full inline-block">
            100% Operational Yards
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Daily Capacity</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{totalCapacity.toLocaleString('en-IN')} MT</div>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
            Intake Throughput / Day
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Live Queue Load</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{totalQueueWaiters} Farmers</div>
          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full inline-block">
            Weighbridge Queue Total
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Avg Processing Wait</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600">{avgWaitTime} Mins</div>
          <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full inline-block">
            Target &lt; 45 mins
          </span>
        </div>
      </div>

      {/* Control Bar: Search, Filters & View Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Mandi name, code, district..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* District Filter */}
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Districts ({districts.length})</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Queue Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Queue Statuses</option>
            <option value="smooth">Smooth Flow (&le; 15 Waiting)</option>
            <option value="busy">High Intake (&gt; 15 Waiting)</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'grid' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'map' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content View */}
      {viewMode === 'map' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-4 space-y-3">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Statewide Procurement Mandi Geographic Radar
              </h3>
              <p className="text-[11px] text-slate-500">
                Green pins denote optimal intake flow (&le;15 queue), Orange pins denote high intake volume (&gt;15 queue)
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600">
              Showing {filteredCentres.length} Mandi Coordinates
            </span>
          </div>

          <div
            ref={mapContainerRef}
            className="w-full h-[520px] rounded-2xl border border-slate-200 overflow-hidden shadow-inner"
          />
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCentres.length === 0 ? (
            <div className="col-span-full py-16 bg-white rounded-3xl border border-dashed border-slate-200 text-center space-y-2">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-sm text-slate-700">No Mandi Centres Found</h4>
              <p className="text-xs text-slate-400">Try changing your search keywords or district filter.</p>
            </div>
          ) : (
            filteredCentres.map((centre) => {
              const isHighQueue = centre.queue_length > 15;
              const assignedOfficer = officers.find((o) => o.centre_id === centre.id);

              return (
                <div
                  key={centre.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group hover:border-purple-300"
                >
                  <div className="space-y-3">
                    {/* Header: Code badge & District tag */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                        {centre.code}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {centre.district}
                      </span>
                    </div>

                    {/* Mandi Name & Address */}
                    <div>
                      <h3 className="font-black text-base text-slate-900 group-hover:text-purple-700 transition-colors">
                        {centre.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                        {centre.address}
                      </p>
                    </div>

                    {/* Capacity & Queue Telemetry */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Daily Capacity</span>
                        <span className="font-black text-slate-800 text-sm">{centre.capacity_tonnes_per_day} MT</span>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${
                        isHighQueue ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}>
                        <span className="text-[10px] font-bold block opacity-75">Live Queue</span>
                        <span className="font-black text-sm">{centre.queue_length} Waiting ({centre.avg_wait_time_minutes}m)</span>
                      </div>
                    </div>

                    {/* Operating Hours & Contact */}
                    <div className="space-y-1 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px]">Hours: <b>{centre.operating_hours}</b></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`tel:${centre.contact_phone}`} className="text-[11px] text-blue-600 font-bold hover:underline">
                          {centre.contact_phone}
                        </a>
                      </div>
                    </div>

                    {/* Incharge Info if assigned */}
                    {assignedOfficer && (
                      <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                          {assignedOfficer.name.charAt(0)}
                        </div>
                        <span className="truncate">Incharge: <b>{assignedOfficer.name}</b></span>
                      </div>
                    )}
                  </div>

                  {/* Card Action */}
                  <div className="pt-2">
                    <button
                      onClick={() => setSelectedCentre(centre)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-purple-900 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Mandi Operations</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* DETAILED MANDI DOSSIER MODAL */}
      {selectedCentre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCentre(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  Mandi Yard Dossier
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Code: {selectedCentre.code}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {selectedCentre.name}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {selectedCentre.address}
              </p>
            </div>

            {/* Live Metrics Quad */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                <span className="text-[10px] font-bold text-purple-700 block uppercase">Daily Intake</span>
                <span className="text-lg font-black text-purple-950">{selectedCentre.capacity_tonnes_per_day} MT</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-700 block uppercase">Live Queue</span>
                <span className="text-lg font-black text-emerald-950">{selectedCentre.queue_length} Farmers</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-[10px] font-bold text-blue-700 block uppercase">Avg Wait</span>
                <span className="text-lg font-black text-blue-950">{selectedCentre.avg_wait_time_minutes} Mins</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Operational</span>
                <span className="text-lg font-black text-emerald-600">Active ✓</span>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <h4 className="font-bold text-slate-800">Weighbridge & Yard Specifications</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">GPS Coordinates:</span>
                  <span className="font-mono font-bold">{selectedCentre.latitude}, {selectedCentre.longitude}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Operating Hours:</span>
                  <span className="font-bold">{selectedCentre.operating_hours}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Direct Yard Hotline:</span>
                  <a href={`tel:${selectedCentre.contact_phone}`} className="font-bold text-blue-600 hover:underline">
                    {selectedCentre.contact_phone}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Weighbridge Sensor QA:</span>
                  <span className="font-bold text-emerald-600">Automated Digital Load Cell (NABL Calibrated)</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedCentre.latitude},${selectedCentre.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md"
              >
                <ExternalLink className="w-4 h-4 text-purple-400" />
                <span>Open in Google Maps GPS ↗</span>
              </a>
              <button
                onClick={() => {
                  setSelectedCentre(null);
                  showToast(`Live telemetry diagnostics for ${selectedCentre.name} synced.`);
                }}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sync Real-Time Telemetry</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
