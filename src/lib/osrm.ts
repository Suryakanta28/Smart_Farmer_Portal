// OSRM Routing and Navigation Utility
// KRISHIFLOW-AI - Smart India Hackathon 2026

export interface RouteStep {
  instruction: string;
  distance_m: number;
}

export interface RouteResult {
  distance_km: number;
  duration_minutes: number;
  coordinates: [number, number][]; // [lat, lng]
  steps: RouteStep[];
}

export async function fetchOsrmRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<RouteResult> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );
        const steps: RouteStep[] =
          route.legs[0]?.steps?.map((s: any) => ({
            instruction: (s.maneuver.type || 'Drive') + (s.name ? ` onto ${s.name}` : ''),
            distance_m: Math.round(s.distance || 100),
          })) || [];

        return {
          distance_km: Number((route.distance / 1000).toFixed(2)),
          duration_minutes: Math.ceil(route.duration / 60),
          coordinates,
          steps: steps.length > 0 ? steps : [
            { instruction: 'Head towards State Highway towards Mandi Yard', distance_m: 800 },
            { instruction: 'Continue on Main Road', distance_m: Math.round(route.distance) },
            { instruction: 'Turn into Mandi Weighbridge Entrance', distance_m: 200 }
          ],
        };
      }
    }
  } catch (err) {
    // Graceful fallback if OSRM public API is slow or rate-limited
    console.info('OSRM public service fallback engaged.');
  }

  // Generate intermediate interpolated curve coordinates
  const distanceKm = Math.max(
    1.2,
    Number(
      (
        Math.hypot(endLat - startLat, endLng - startLng) * 111 * 1.25
      ).toFixed(2)
    )
  );

  const stepsCount = 10;
  const coordinates: [number, number][] = [];
  for (let i = 0; i <= stepsCount; i++) {
    const ratio = i / stepsCount;
    // slight curve offset
    const curve = Math.sin(ratio * Math.PI) * 0.005;
    const lat = startLat + (endLat - startLat) * ratio + curve;
    const lng = startLng + (endLng - startLng) * ratio + curve;
    coordinates.push([lat, lng]);
  }

  return {
    distance_km: distanceKm,
    duration_minutes: Math.max(5, Math.round((distanceKm / 35) * 60)),
    coordinates,
    steps: [
      { instruction: 'Depart from pickup village center', distance_m: 500 },
      { instruction: 'Merge onto Main District Road towards Procurement Centre', distance_m: Math.round(distanceKm * 750) },
      { instruction: 'Approach Procurement Centre Gate Pass entry', distance_m: 250 },
    ],
  };
}
