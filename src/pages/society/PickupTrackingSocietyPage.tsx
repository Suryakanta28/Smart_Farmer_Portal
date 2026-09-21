// Pickup Tracking Page for Society Officers (All Active Vehicles on Map)
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState, useEffect, useRef } from 'react';
import { Truck, MapPin, Phone, RotateCw } from 'lucide-react';
import { db, Vehicle, ProcurementCentre } from '../../lib/db';
import L from 'leaflet';

export const PickupTrackingSocietyPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    setVehicles(db.getCollection<Vehicle>('vehicles'));

    const unsub = db.subscribe('table:vehicles', (data: Vehicle[]) => {
      setVehicles(data);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [21.4669, 83.9812],
        zoom: 12,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap | FPP Society Fleet',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Add vehicles
    vehicles.forEach((veh) => {
      const isTrip = veh.status === 'on_trip' || veh.status === 'assigned';
      const icon = L.divIcon({
        className: 'society-veh-marker',
        html: `
          <div style="
            width: 36px;
            height: 36px;
            background: ${isTrip ? '#16a34a' : '#64748b'};
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          ">
            <span style="font-size: 18px;">🚚</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([veh.latitude, veh.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px;">
            <b>${veh.driver_name}</b> (${veh.registration_number})<br/>
            Type: ${veh.vehicle_type}<br/>
            Status: <b style="color: ${isTrip ? '#16a34a' : '#64748b'};">${veh.status.toUpperCase()}</b><br/>
            Phone: ${veh.driver_phone}
          </div>
        `);

      markersRef.current[veh.id] = marker;
    });
  }, [vehicles]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            🚚 Real-Time Logistics Fleet Radar
          </h2>
          <p className="text-xs text-slate-500">
            Live telemetry tracking of all trolleys and trucks dispatched across society villages
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            {vehicles.filter((v) => v.status === 'on_trip' || v.status === 'assigned').length} Active Dispatches
          </span>
        </div>
      </div>

      <div className="relative h-[550px] rounded-3xl overflow-hidden shadow-xl border border-slate-200">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {vehicles.map((v) => (
          <div key={v.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">{v.driver_name}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                v.status === 'on_trip' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {v.status.toUpperCase()}
              </span>
            </div>
            <p className="text-slate-500">{v.vehicle_type} • {v.registration_number}</p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-400">Cap: {v.capacity_kg} kg</span>
              <a href={`tel:${v.driver_phone}`} className="text-blue-600 font-bold hover:underline">
                Call Driver
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
