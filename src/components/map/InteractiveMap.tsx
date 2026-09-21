// Interactive Procurement Centre Leaflet Map
// KRISHIFLOW-AI - Smart India Hackathon 2026

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Clock, Users, Phone, Navigation, List, Map as MapIcon, ChevronRight } from 'lucide-react';
import { ProcurementCentre, db } from '../../lib/db';
import { calculateDistanceKm } from '../../lib/haversine';
import L from 'leaflet';

interface InteractiveMapProps {
  onSelectCentre?: (centre: ProcurementCentre) => void;
  selectedCentreId?: string;
  showBookSlotButton?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  onSelectCentre,
  selectedCentreId,
  showBookSlotButton = false,
}) => {
  const { t } = useTranslation();
  const [centres, setCentres] = useState<ProcurementCentre[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeCentre, setActiveCentre] = useState<ProcurementCentre | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // Fetch centres and subscribe to live changes
  useEffect(() => {
    setCentres(db.getCollection<ProcurementCentre>('centres'));

    const unsubscribe = db.subscribe('table:centres', (data: ProcurementCentre[]) => {
      setCentres(data);
    });

    // Detect user location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Default to Sambalpur central point
          setUserLocation({ lat: 21.4669, lng: 83.9812 });
        }
      );
    } else {
      setUserLocation({ lat: 21.4669, lng: 83.9812 });
    }

    return () => unsubscribe();
  }, []);

  // Filter centres
  const filteredCentres = centres.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.district.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = centres[0]?.latitude || 21.4669;
      const initialLng = centres[0]?.longitude || 83.9812;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 8,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | FPP Locator',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Custom Red Marker for Procurement Mandis
    const mandiIcon = L.divIcon({
      className: 'custom-mandi-pin',
      html: `
        <div style="
          background: #ef4444;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(239, 68, 68, 0.5);
          border: 2px solid white;
        ">
          <span style="transform: rotate(45deg); font-size: 14px; font-weight: bold;">🌾</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    // Add User Location Marker (Blue)
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-pin',
        html: `
          <div class="pulse-marker" style="background: #3b82f6; border: 2px solid white;">
            <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>📍 Your Location</b><br/>Browser Geolocation Detected');
    }

    // Add Centre Markers
    filteredCentres.forEach((centre) => {
      const marker = L.marker([centre.latitude, centre.longitude], { icon: mandiIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; min-width: 220px; padding: 4px;">
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #0f172a;">${centre.name}</h4>
            <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">${centre.address}</p>
            <div style="background: #f1f5f9; padding: 6px; border-radius: 6px; font-size: 11px; margin-bottom: 8px;">
              <div>👥 <b>Current Queue:</b> ${centre.queue_length} Farmers</div>
              <div>⏱️ <b>Avg Wait Time:</b> ${centre.avg_wait_time_minutes} Mins</div>
              <div>🕒 <b>Hours:</b> ${centre.operating_hours}</div>
              <div>📞 <b>Contact:</b> ${centre.contact_phone}</div>
            </div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}" target="_blank" style="display: block; text-align: center; background: #16a34a; color: white; padding: 6px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold;">
              🚗 Get Directions (OSRM)
            </a>
          </div>
        `);

      marker.on('click', () => {
        setActiveCentre(centre);
        if (onSelectCentre) onSelectCentre(centre);
      });

      markersRef.current[centre.id] = marker;
    });

    if (filteredCentres.length > 0) {
      const group = L.featureGroup(Object.values(markersRef.current));
      map.fitBounds(group.getBounds().pad(0.15));
    }
  }, [viewMode, filteredCentres, userLocation]);

  const openDirections = (centre: ProcurementCentre) => {
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
    const dest = `${centre.latitude},${centre.longitude}`;
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('centres.searchPlaceholder', 'Search village, mandi, district (Sambalpur, Bargarh, Karnal)...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">
            {filteredCentres.length} {t('centres.allCentres', 'Centres Active')}
          </span>
          <div className="flex bg-slate-200 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'map' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{t('centres.mapView', 'Map View')}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{t('centres.listView', 'List View')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="relative h-[480px] w-full">
          <div ref={mapContainerRef} className="h-full w-full" />
          
          {/* Active Centre Bottom Overlay Card */}
          {activeCentre && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-20 bg-white/95 backdrop-blur p-4 rounded-xl shadow-2xl border border-slate-200 animate-slide-in">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    {t('centres.selectedMandi', 'Selected Mandi')}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">
                    {activeCentre.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{activeCentre.district} {t('centres.district', 'District')}</p>
                </div>
                <button
                  onClick={() => setActiveCentre(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs p-1"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block">{t('centres.queueLength', 'Queue Length')}</span>
                  <span className="font-bold text-slate-800">{activeCentre.queue_length} {t('centres.farmers', 'Farmers')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{t('centres.avgWait', 'Wait Time')}</span>
                  <span className="font-bold text-slate-800">~{activeCentre.avg_wait_time_minutes} {t('centres.mins', 'mins')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openDirections(activeCentre)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  {t('centres.getDirections', 'Get Directions')}
                </button>
                {showBookSlotButton && onSelectCentre && (
                  <button
                    onClick={() => onSelectCentre(activeCentre)}
                    className="flex items-center justify-center px-3 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold"
                  >
                    {t('centres.select', 'Select')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View with Geolocation Distance */}
      {viewMode === 'list' && (
        <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
          {filteredCentres.map((centre) => {
            const distance = userLocation
              ? calculateDistanceKm(
                  userLocation.lat,
                  userLocation.lng,
                  centre.latitude,
                  centre.longitude
                )
              : null;

            const isSelected = selectedCentreId === centre.id;

            return (
              <div
                key={centre.id}
                className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-emerald-50/40 transition-colors ${
                  isSelected ? 'bg-emerald-50 border-l-4 border-emerald-600' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{centre.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                      {centre.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {centre.address}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      {t('centres.queueLength', 'Queue')}: <b>{centre.queue_length} {t('centres.farmers', 'farmers')}</b>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {t('centres.avgWait', 'Avg Wait')}: <b>{centre.avg_wait_time_minutes} {t('centres.mins', 'mins')}</b>
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {centre.contact_phone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  {distance !== null && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">{t('centres.distance', 'Distance')}</span>
                      <span className="text-xs font-bold text-emerald-700">{distance} km</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => openDirections(centre)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {t('centres.getDirections', 'Directions')}
                    </button>
                    {onSelectCentre && (
                      <button
                        onClick={() => onSelectCentre(centre)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors ${
                          isSelected ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {isSelected ? t('centres.selectedDone', 'Selected ✓') : t('centres.selectCentre', 'Select Centre')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
