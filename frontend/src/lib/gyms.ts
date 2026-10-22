// Gym search (OpenStreetMap via the Overpass API), in-app routes (OSM routing servers), and "open in maps".
import { Linking, Platform } from 'react-native';

export type LatLng = { latitude: number; longitude: number };
export type Mode = 'walking' | 'driving';
export type Gym = { id: string; name: string; lat: number; lon: number; distance: number; address?: string; hours?: string; phone?: string; website?: string };
export type Route = { coords: LatLng[]; distance: number; duration: number };

export const distanceM = (a: LatLng, b: LatLng) => {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude), dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};
export const fmtDist = (m: number) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1)} km`);
export const fmtTime = (s: number) => {
  const m = Math.max(1, Math.round(s / 60));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

// Public Overpass servers. For production, send this request through your own backend (for example a Supabase Edge Function).
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

async function overpass(query: string) {
  let last: unknown;
  for (const url of ENDPOINTS) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 20000);
    try {
      const res = await fetch(url, {
        method: 'POST', signal: ctl.signal,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) { last = e; } finally { clearTimeout(timer); }
  }
  throw last;
}

// Looks 3 km around the user first, then widens to 8 km and 20 km until gyms are found. Nearest first.
export async function searchGyms(c: LatLng, radii = [3000, 8000, 20000]): Promise<Gym[]> {
  for (const r of radii) {
    const at = `(around:${r},${c.latitude},${c.longitude})`;
    const q = `[out:json][timeout:20];(nwr["leisure"="fitness_centre"]${at};nwr["amenity"="gym"]${at};nwr["leisure"="sports_centre"]["sport"~"fitness|gym"]${at};);out center tags 60;`;
    const data = await overpass(q);
    const seen = new Set<string>();
    const gyms: Gym[] = [];
    for (const e of data.elements ?? []) {
      const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
      const id = `${e.type}/${e.id}`;
      if (lat == null || lon == null || seen.has(id)) continue;
      seen.add(id);
      const t = e.tags ?? {};
      gyms.push({
        id, lat, lon, name: t.name ?? 'Fitness center',
        distance: distanceM(c, { latitude: lat, longitude: lon }),
        address: [t['addr:housenumber'], t['addr:street'], t['addr:suburb'] ?? t['addr:city']].filter(Boolean).join(' ') || undefined,
        hours: t.opening_hours, phone: t.phone ?? t['contact:phone'], website: t.website ?? t['contact:website'],
      });
    }
    if (gyms.length) return gyms.sort((a, b) => a.distance - b.distance).slice(0, 25);
  }
  return [];
}

// Route line drawn on the map (OpenStreetMap-based routing servers, no API key).
export async function getRoute(from: LatLng, to: LatLng, mode: Mode): Promise<Route> {
  const base = mode === 'walking'
    ? 'https://routing.openstreetmap.de/routed-foot/route/v1/foot/'
    : 'https://routing.openstreetmap.de/routed-car/route/v1/driving/';
  const res = await fetch(`${base}${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`);
  const j = await res.json();
  const r = j.routes?.[0];
  if (!r) throw new Error('No route found');
  return {
    coords: r.geometry.coordinates.map(([lon, lat]: number[]) => ({ latitude: lat, longitude: lon })),
    distance: r.distance, duration: r.duration,
  };
}

// Turn-by-turn navigation in the phone's maps app.
export const openNavigation = (g: { lat: number; lon: number }, mode: Mode) =>
  Linking.openURL(Platform.OS === 'ios'
    ? `http://maps.apple.com/?daddr=${g.lat},${g.lon}&dirflg=${mode === 'walking' ? 'w' : 'd'}`
    : `https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lon}&travelmode=${mode}`);
