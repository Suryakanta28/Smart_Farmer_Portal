// Live GPS Real-Time Vehicle Tracking Leaflet Map
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useEffect, useRef, useState } from 'react';
import { Phone, Navigation, Clock, Truck, ShieldAlert, CheckCircle2, RotateCw } from 'lucide-react';
import { Vehicle, Trip, ProcurementCentre, db } from '../../lib/db';
import { calculateDistanceKm, calculateEtaMinutes } from '../../lib/haversine';
import { fetchOsrmRoute } from '../../lib/osrm';
import L from 'leaflet';

interface LiveGpsMapProps {
  vehicleId?: string;
  tripId?: string;
  centreId?: string;
  isDriverView?: boolean;
}

export const LiveGpsMap: React.FC<LiveGpsMapProps> = ({
  vehicleId = 'veh-01',
  tripId = 'trip-01',
  centreId = 'cen-03',
  isDriverView = false,
}) => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [centre, setCentre] = useState<ProcurementCentre | null>(null);
  const [farmerCoords, setFarmerCoords] = useState<{ lat: number; lng: number }>({
    lat: 21.4820,
    lng: 83.9620,
  });
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [eta, setEta] = useState<number>(14);
  const [distance, setDistance] = useState<number>(4.8);
  const [lastUpdate, setLastUpdate] = useState<string>('Just now');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Load initial data and subscribe to real-time updates
  useEffect(() => {
    const loadState = () => {
      const vehicles = db.getCollection<Vehicle>('vehicles');
      const foundVeh = vehicles.find((v) => v.id === vehicleId) || vehicles[0];
      setVehicle(foundVeh);

      const trips = db.getCollection<Trip>('trips');
      const foundTrip = trips.find((t) => t.id === tripId) || trips[0];
      setTrip(foundTrip);

      const centres = db.getCollection<ProcurementCentre>('centres');
      const foundCentre = centres.find((c) => c.id === centreId) || centres[0];
      setCentre(foundCentre);
    };

    loadState();

    // Subscribe to vehicle real-time GPS updates (every 10s)
    const unsubVehicles = db.subscribe('table:vehicles', (allVehicles: Vehicle[]) => {
      const updated = allVehicles.find((v) => v.id === vehicleId);
      if (updated) {
        setVehicle(updated);
        setLastUpdate(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    });

    const unsubTrips = db.subscribe('table:trips', (allTrips: Trip[]) => {
      const updated = allTrips.find((t) => t.id === tripId);
      if (updated) setTrip(updated);
    });

    // Browser Geolocation for farmer/driver
    if ('geolocation' in navigator && !isDriverView) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFarmerCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }

    return () => {
      unsubVehicles();
      unsubTrips();
    };
  }, [vehicleId, tripId, centreId, isDriverView]);

  // Recalculate Distance & ETA & Fetch OSRM Route
  useEffect(() => {
    if (!vehicle || !centre) return;

    // Target depends on trip status
    const targetLat = trip?.status === 'going_to_centre' ? centre.latitude : farmerCoords.lat;
    const targetLng = trip?.status === 'going_to_centre' ? centre.longitude : farmerCoords.lng;

    const dist = calculateDistanceKm(vehicle.latitude, vehicle.longitude, targetLat, targetLng);
    const etaMins = calculateEtaMinutes(dist);

    setDistance(dist);
    setEta(etaMins);

    // Fetch OSRM polyline
    fetchOsrmRoute(vehicle.latitude, vehicle.longitude, targetLat, targetLng).then((res) => {
      setRouteCoordinates(res.coordinates);
    });
  }, [vehicle, centre, farmerCoords, trip?.status]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = vehicle?.latitude || 21.4680;
      const initialLng = vehicle?.longitude || 83.9780;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | FPP GPS Fleet',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // 1. Vehicle Marker (Green Truck with radar pulse)
    if (vehicle) {
      const vehicleIcon = L.divIcon({
        className: 'vehicle-pin',
        html: `
          <div style="position: relative;">
            <div style="
              width: 40px;
              height: 40px;
              background: #16a34a;
              border: 3px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 15px rgba(22, 163, 74, 0.6);
            ">
              <span style="font-size: 20px;">🚚</span>
            </div>
            <div style="
              position: absolute;
              top: -4px;
              left: -4px;
              width: 48px;
              height: 48px;
              border: 2px solid #22c55e;
              border-radius: 50%;
              animation: pulse-ring 2s infinite;
            "></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (!vehicleMarkerRef.current) {
        vehicleMarkerRef.current = L.marker([vehicle.latitude, vehicle.longitude], {
          icon: vehicleIcon,
        }).addTo(map);
      } else {
        vehicleMarkerRef.current.setLatLng([vehicle.latitude, vehicle.longitude]);
      }

      vehicleMarkerRef.current.bindPopup(`
        <b>🚚 ${vehicle.driver_name}</b><br/>
        Reg: ${vehicle.registration_number}<br/>
        Status: <span style="text-transform: capitalize; color: #16a34a; font-weight: bold;">${trip?.status?.replace('_', ' ') || vehicle.status}</span><br/>
        Speed: ~34 km/h (Live GPS)
      `);
    }

    // 2. Farmer Location Marker (Blue)
    const farmerIcon = L.divIcon({
      className: 'farmer-pin',
      html: `
        <div style="
          width: 34px;
          height: 34px;
          background: #2563eb;
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.5);
        ">
          <span style="font-size: 16px;">👨🌾</span>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
    const fMarker = L.marker([farmerCoords.lat, farmerCoords.lng], { icon: farmerIcon })
      .addTo(map)
      .bindPopup('<b>🌾 Farmer Pickup Location</b><br/>Village Point');

    // 3. Procurement Centre Marker (Red)
    if (centre) {
      const centreIcon = L.divIcon({
        className: 'centre-pin',
        html: `
          <div style="
            width: 36px;
            height: 36px;
            background: #dc2626;
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5);
          ">
            <span style="font-size: 18px;">🏢</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      L.marker([centre.latitude, centre.longitude], { icon: centreIcon })
        .addTo(map)
        .bindPopup(`<b>🏢 ${centre.name}</b><br/>Mandi Destination`);
    }

    // 4. Route Polyline
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
    }

    if (routeCoordinates.length > 0) {
      routePolylineRef.current = L.polyline(routeCoordinates, {
        color: '#16a34a',
        weight: 5,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(map);

      map.fitBounds(routePolylineRef.current.getBounds().pad(0.2));
    }
  }, [vehicle, farmerCoords, centre, routeCoordinates, trip?.status]);

  const recenterMap = () => {
    if (mapInstanceRef.current && vehicle) {
      mapInstanceRef.current.setView([vehicle.latitude, vehicle.longitude], 14, { animate: true });
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'going_to_farmer':
        return { label: 'En Route to Farmer', color: 'bg-blue-100 text-blue-800' };
      case 'arrived':
        return { label: 'Arrived at Farm', color: 'bg-amber-100 text-amber-800' };
      case 'picked_up':
        return { label: 'Crop Loaded', color: 'bg-purple-100 text-purple-800' };
      case 'going_to_centre':
        return { label: 'In Transit to Mandi', color: 'bg-emerald-100 text-emerald-800' };
      case 'at_centre':
        return { label: 'At Mandi Gate', color: 'bg-teal-100 text-teal-800' };
      case 'completed':
        return { label: 'Trip Completed', color: 'bg-slate-100 text-slate-800' };
      default:
        return { label: 'Assigned', color: 'bg-blue-100 text-blue-800' };
    }
  };

  const statusBadge = getStatusBadge(trip?.status);

  return (
    <div className="relative w-full h-[580px] rounded-2xl overflow-hidden shadow-xl border border-slate-200">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Telemetry Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur px-3.5 py-2 rounded-xl shadow-lg border border-slate-200 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-slate-900">LIVE GPS STREAM</span>
          </div>
          <span className="text-[11px] text-slate-500 border-l border-slate-200 pl-3">
            Updated: {lastUpdate}
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={recenterMap}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-lg border border-slate-200 transition-all hover:scale-105"
          >
            <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
            Center on Vehicle
          </button>
        </div>
      </div>

      {/* Bottom Floating Card: Driver, ETA, Vehicle Specs */}
      <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 z-20 bg-white/95 backdrop-blur p-5 rounded-2xl shadow-2xl border border-slate-200 animate-slide-in">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
            <h4 className="font-extrabold text-base text-slate-900 mt-1">
              {vehicle?.driver_name || 'Suresh Kumar Mohapatra'}
            </h4>
            <p className="text-xs text-slate-500">
              {vehicle?.vehicle_type} • {vehicle?.registration_number}
            </p>
          </div>

          <a
            href={`tel:${vehicle?.driver_phone || '+919876543210'}`}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-transform active:scale-95"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Driver</span>
          </a>
        </div>

        {/* ETA & Distance Telemetry Cards */}
        <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Estimated Arrival</span>
              <span className="text-sm font-extrabold text-slate-900">~{eta} Minutes</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Remaining Distance</span>
              <span className="text-sm font-extrabold text-slate-900">{distance} km</span>
            </div>
          </div>
        </div>

        {/* Route Details */}
        <div className="text-xs text-slate-600 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Pickup Destination:</span>
            <span className="font-semibold text-slate-800">
              {trip?.village || 'Sambalpur Rural (Farm Yard)'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Target Mandi:</span>
            <span className="font-semibold text-slate-800">
              {centre?.name || 'Sambalpur Regulated Mandi'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
