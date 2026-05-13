import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';
import { ChevronLeft, ChevronRight, Minus, Plus, Scan, Search } from 'lucide-react';

type TechnicianLocation = {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  is_active: boolean;
  current_jobs: number;
  latest_booking_status?: string | null;
  latest_booking_id?: number | null;
  booking_address?: string | null;
  booking_latitude?: number | null;
  booking_longitude?: number | null;
  live_latitude?: number | null;
  live_longitude?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  location_recorded_at?: string | null;
  status: 'available' | 'assigned' | 'enroute' | 'onsite' | 'offline';
  location_source: 'live' | 'booking' | 'fallback';
};

type UserLocation = {
  booking_id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_name: string;
  package_name: string;
  status: string;
  address_line: string;
  building_name?: string | null;
  floor_number?: string | null;
  apartment_number?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  technician_name?: string | null;
};

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  'http://127.0.0.1:8000';

function getStatusColor(status: TechnicianLocation['status']): string {
  switch (status) {
    case 'available':
      return '#10b981';
    case 'assigned':
      return '#8b5cf6';
    case 'enroute':
      return '#f59e0b';
    case 'onsite':
      return '#0f766e';
    case 'offline':
      return '#6b7280';
    default:
      return '#6b7280';
  }
}

function getStatusText(status: TechnicianLocation['status']): string {
  switch (status) {
    case 'available':
      return 'Available';
    case 'assigned':
      return 'Assigned';
    case 'enroute':
      return 'En Route';
    case 'onsite':
      return 'On Site';
    case 'offline':
      return 'Offline';
    default:
      return status;
  }
}

function initials(name: string): string {
  const bits = name.trim().split(/\s+/).filter(Boolean);
  if (!bits.length) return 'T';
  if (bits.length === 1) return bits[0].slice(0, 2).toUpperCase();
  return `${bits[0][0] ?? ''}${bits[1][0] ?? ''}`.toUpperCase();
}

function getUserInitials(user: UserLocation): string {
  if (user.technician_name?.trim()) {
    return initials(user.technician_name);
  }

  return 'U';
}

function getUserIcon(user: UserLocation): L.DivIcon {
  return L.divIcon({
    className: 'user-div-icon',
    html: `
      <div class="user-marker-wrap">
        <div class="user-marker-dot">${getUserInitials(user)}</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

function getTechnicianIcon(technician: TechnicianLocation): L.DivIcon {
  const color = getStatusColor(technician.status);
  const isLive = technician.location_source === 'live';
  return L.divIcon({
    className: 'technician-div-icon',
    html: `
      <div class="tech-marker-wrap ${isLive ? 'live' : ''}">
        <div class="tech-marker-dot" style="background:${color};">${initials(technician.full_name)}</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

function getAuthHeaders(): Record<string, string> {
  const token =
    window.localStorage.getItem('admin_token') ||
    window.localStorage.getItem('backend_access_token');

  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof payload.detail === 'string' ? payload.detail : 'Unable to load map data';
    throw new Error(detail);
  }

  return payload as T;
}

function GeocoderControl() {
  const map = useMap();
  useEffect(() => {
    type GeocoderControlInstance = L.Control & {
      on: (eventName: string, handler: (event: any) => GeocoderControlInstance | void) => GeocoderControlInstance;
      addTo: (targetMap: L.Map) => GeocoderControlInstance;
    };

    const geocoder = (L.Control as unknown as {
      geocoder: (options: { defaultMarkGeocode?: boolean }) => GeocoderControlInstance;
    }).geocoder({
      defaultMarkGeocode: false,
    })
      .on('markgeocode', (e: any) => {
        const bbox = e.geocode.bbox;
        const poly = L.polygon([
          bbox.getSouthEast(),
          bbox.getNorthEast(),
          bbox.getNorthWest(),
          bbox.getSouthWest(),
        ]);
        map.fitBounds(poly.getBounds());
      })
      .addTo(map);
    return () => {
      map.removeControl(geocoder);
    };
  }, [map]);
  return null;
}

function FitMapToMarkers({ markers }: { markers: Array<{ lat: number; lng: number }> }) {
  const map = useMap();
  const hasFittedRef = useRef(false);
  const userMovedMapRef = useRef(false);
  const lastSignatureRef = useRef('');
  const markerSignature = useMemo(() => markers.map((marker) => `${marker.lat.toFixed(5)}:${marker.lng.toFixed(5)}`).join('|'), [markers]);

  useEffect(() => {
    const markInteracted = () => {
      userMovedMapRef.current = true;
    };

    map.on('dragstart', markInteracted);
    map.on('zoomstart', markInteracted);

    return () => {
      map.off('dragstart', markInteracted);
      map.off('zoomstart', markInteracted);
    };
  }, [map]);

  useEffect(() => {
    if (lastSignatureRef.current !== markerSignature) {
      lastSignatureRef.current = markerSignature;
      hasFittedRef.current = false;
      userMovedMapRef.current = false;
    }

    if (hasFittedRef.current || userMovedMapRef.current) {
      return;
    }

    if (!markers.length) {
      map.setView([20.5937, 78.9629], 5);
      hasFittedRef.current = true;
      return;
    }

    const bounds = L.latLngBounds(markers.map((marker) => [marker.lat, marker.lng]));
    map.fitBounds(bounds.pad(0.18), { animate: true });
    hasFittedRef.current = true;
  }, [map, markerSignature, markers]);

  return null;
}

function fitToMarkerBounds(map: L.Map, markers: Array<{ lat: number; lng: number }>, fallback: [number, number], fallbackZoom: number) {
  if (!markers.length) {
    map.setView(fallback, fallbackZoom);
    return;
  }

  const bounds = L.latLngBounds(markers.map((marker) => [marker.lat, marker.lng]));
  map.fitBounds(bounds.pad(0.18), { animate: true });
}

function MapInstanceBridge({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  return null;
}

function DetailButton({ label, onClick, variant = 'default' }: { label: string; onClick: () => void; variant?: 'default' | 'primary' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${variant === 'primary' ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'}`}
    >
      {label}
    </button>
  );
}

function focusMapOnPoint(map: L.Map | null, lat?: number | null, lng?: number | null, zoom = 16) {
  if (!map || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return;
  }

  map.flyTo([Number(lat), Number(lng)], zoom, { animate: true });
}

export default function TechnicianTrackingMap() {
  const [technicians, setTechnicians] = useState<TechnicianLocation[]>([]);
  const [users, setUsers] = useState<UserLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [technicianQuery, setTechnicianQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null);
  const [selectedUserBookingId, setSelectedUserBookingId] = useState<number | null>(null);
  const [activeSidebar, setActiveSidebar] = useState<'user' | 'technician' | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);

  useEffect(() => {
    if (!mapInstance) return;

    // Ensure wheel zoom is disabled by default until the user explicitly
    // taps/clicks inside the map. This prevents accidental scroll zooming.
    try {
      mapInstance.scrollWheelZoom?.disable();
    } catch (err) {
      // ignore
    }

    const container = mapInstance.getContainer();

    const onDocClick = (e: Event) => {
      const ev = e as MouseEvent & { composedPath?: () => EventTarget[] };
      const path = typeof ev.composedPath === 'function' ? ev.composedPath() : null;
      const clickedInside = path ? path.includes(container) : container.contains(e.target as Node);

      try {
        if (clickedInside) {
          mapInstance.scrollWheelZoom?.enable();
        } else {
          mapInstance.scrollWheelZoom?.disable();
        }
      } catch (err) {
        // ignore
      }
    };

    document.addEventListener('click', onDocClick, true);
    document.addEventListener('touchstart', onDocClick, true);

    return () => {
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('touchstart', onDocClick, true);
      try {
        mapInstance.scrollWheelZoom?.disable();
      } catch (err) {
        // ignore
      }
    };
  }, [mapInstance]);

  const loadMapData = async (silent = true) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }

      const [technicianPayload, userPayload] = await Promise.all([
        fetchJson<{ technicians?: TechnicianLocation[] }>('/api/technicians/locations'),
        fetchJson<{ users?: UserLocation[] }>('/api/users/locations'),
      ]);

      setTechnicians(technicianPayload.technicians ?? []);
      setUsers(userPayload.users ?? []);
      setError(null);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to load tracking map';
      setError(message);
      if (!silent) {
        setTechnicians([]);
        setUsers([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMapData(false);

    const timer = window.setInterval(() => {
      void loadMapData(true);
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const filteredTechnicians = useMemo(() => {
    const needle = technicianQuery.trim().toLowerCase();
    if (!needle) {
      return technicians;
    }

    return technicians.filter((technician) => {
      return [
        technician.full_name,
        technician.email,
        technician.phone_number,
        technician.location_source,
        technician.latest_booking_status,
        technician.booking_address,
      ].some((value) => String(value ?? '').toLowerCase().includes(needle));
    });
  }, [technicianQuery, technicians]);

  const filteredUsers = useMemo(() => {
    const needle = userQuery.trim().toLowerCase();
    if (!needle) {
      return users;
    }

    return users.filter((user) => {
      return [
        user.customer_name,
        user.customer_email,
        user.customer_phone,
        user.address_line,
        user.package_name,
        user.service_name,
        user.status,
      ].some((value) => String(value ?? '').toLowerCase().includes(needle));
    });
  }, [userQuery, users]);

  const mapMarkers = useMemo(() => {
    const technicianMarkers = filteredTechnicians
      .filter((technician) => Number.isFinite(technician.latitude) && Number.isFinite(technician.longitude))
      .map((technician) => ({
        kind: 'technician' as const,
        id: `tech-${technician.id}`,
        lat: Number(technician.latitude),
        lng: Number(technician.longitude),
        technician,
      }));

    const userMarkers = filteredUsers
      .filter((user) => Number.isFinite(user.latitude) && Number.isFinite(user.longitude))
      .map((user) => ({
        kind: 'user' as const,
        id: `user-${user.booking_id}`,
        lat: Number(user.latitude),
        lng: Number(user.longitude),
        user,
      }));

    return [...technicianMarkers, ...userMarkers];
  }, [filteredTechnicians, filteredUsers]);

  useEffect(() => {
    if (selectedTechnicianId === null && selectedUserBookingId === null) {
      return;
    }

    if (selectedTechnicianId !== null && !filteredTechnicians.some((item) => item.id === selectedTechnicianId)) {
      setSelectedTechnicianId(filteredTechnicians[0]?.id ?? null);
    }

    if (selectedUserBookingId !== null && !filteredUsers.some((item) => item.booking_id === selectedUserBookingId)) {
      setSelectedUserBookingId(filteredUsers[0]?.booking_id ?? null);
    }
  }, [filteredTechnicians, filteredUsers, selectedTechnicianId, selectedUserBookingId]);

  const selectedTechnician = useMemo(
    () => filteredTechnicians.find((item) => item.id === selectedTechnicianId) ?? filteredTechnicians[0] ?? null,
    [filteredTechnicians, selectedTechnicianId],
  );

  const selectedUser = useMemo(
    () => filteredUsers.find((item) => item.booking_id === selectedUserBookingId) ?? filteredUsers[0] ?? null,
    [filteredUsers, selectedUserBookingId],
  );

  const selectedUserCoordinates = useMemo(
    () => ({ lat: selectedUser?.latitude ?? null, lng: selectedUser?.longitude ?? null }),
    [selectedUser],
  );

  const selectedTechnicianCoordinates = useMemo(
    () => ({ lat: selectedTechnician?.latitude ?? null, lng: selectedTechnician?.longitude ?? null }),
    [selectedTechnician],
  );

  const technicianFitMarkers = useMemo(
    () => filteredTechnicians
      .filter((technician) => Number.isFinite(technician.latitude) && Number.isFinite(technician.longitude))
      .map((technician) => ({ lat: Number(technician.latitude), lng: Number(technician.longitude) })),
    [filteredTechnicians],
  );

  const hasAssignedTechnicianForSelectedUser = useMemo(
    () => Boolean(selectedUser?.technician_name && selectedUser.technician_name.trim() && selectedUser.technician_name !== 'Unassigned'),
    [selectedUser],
  );

  const openGeocoderSearch = () => {
    if (!mapInstance) {
      return;
    }

    const mapContainer = mapInstance.getContainer();
    const trigger = mapContainer.querySelector('.leaflet-control-geocoder-icon') as HTMLElement | null;
    trigger?.click();

    const input = mapContainer.querySelector('.leaflet-control-geocoder-form input') as HTMLInputElement | null;
    input?.focus();
    input?.select();
  };

  const displayedTechnicianStatuses = useMemo(() => {
    const statusOrder: TechnicianLocation['status'][] = ['available', 'assigned', 'enroute', 'onsite', 'offline'];
    const present = new Set(filteredTechnicians.map((technician) => technician.status));
    return statusOrder.filter((status) => present.has(status));
  }, [filteredTechnicians]);

  if (isLoading) {
    return (
      <div className="flex min-h-155 h-[calc(100vh-10.5rem)] items-center justify-center rounded-3xl bg-slate-950 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/10 px-6 py-5 backdrop-blur-xl">
          Loading tracking map...
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-0 isolate h-[calc(100vh-10.5rem)] min-h-155 overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950 shadow-2xl">
      <style>{`
        .technician-div-icon {
          background: transparent;
          border: 0;
        }
        .tech-marker-wrap {
          width: 40px;
          height: 40px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tech-marker-dot {
          width: 34px;
          height: 34px;
          border-radius: 9999px;
          border: 2px solid #ffffff;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.28);
          z-index: 2;
        }
        .tech-marker-wrap.live::before {
          content: '';
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 9999px;
          background: rgba(59, 130, 246, 0.35);
          animation: tech-pulse 1.6s infinite ease-out;
          z-index: 1;
        }
        @keyframes tech-pulse {
          0% { transform: scale(1); opacity: 0.65; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .user-div-icon {
          background: transparent;
          border: 0;
        }
        .user-marker-wrap {
          width: 40px;
          height: 40px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .user-marker-dot {
          width: 34px;
          height: 34px;
          border-radius: 9999px;
          border: 2px solid #ffffff;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fb923c, #f97316);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.28);
        }
        .drawer-panel {
          width: min(420px, calc(100% - 72px));
          backdrop-filter: blur(16px);
        }
        .drawer-collapsed {
          width: 56px;
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
      <div className="absolute inset-0 z-0">
        <MapContainer center={[12.9716, 77.5946]} zoom={12} zoomControl={false} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeocoderControl />
          <FitMapToMarkers markers={mapMarkers} />
          <MapInstanceBridge onMapReady={setMapInstance} />

          {mapMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={marker.kind === 'technician' ? getTechnicianIcon(marker.technician) : getUserIcon(marker.user)}
              eventHandlers={{
                click: () => {
                  if (marker.kind === 'technician') {
                    setSelectedTechnicianId(marker.technician.id);
                    setActiveSidebar('technician');
                  } else {
                    setSelectedUserBookingId(marker.user.booking_id);
                    setActiveSidebar('user');
                  }
                },
              }}
            />
          ))}
        </MapContainer>
      </div>

      {error && (
        <div className="absolute left-4 top-4 z-1200 max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-lg dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-200">
          {error}
        </div>
      )}

      <div className="absolute right-28 top-7 z-1200">
        <button
          type="button"
          onClick={() => setActiveSidebar((current) => (current === 'user' ? null : 'user'))}
          className="rounded-l-full rounded-r-full border border-blue-300 bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-600 dark:border-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          User
        </button>
      </div>

      <div className="absolute right-46 top-7 z-1200">
        <button
          type="button"
          onClick={() => setActiveSidebar((current) => (current === 'technician' ? null : 'technician'))}
          className="rounded-l-full rounded-r-full border border-blue-300 bg-blue-500 px-3 py-1.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-600 dark:border-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          Technician
        </button>
      </div>

      <div className="absolute left-4 bottom-4 z-1200">
        <button
          type="button"
          onClick={() => {
            if (!mapInstance) {
              return;
            }
            fitToMarkerBounds(mapInstance, technicianFitMarkers, [12.9716, 77.5946], 12);
          }}
          className="rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1.5 text-sm font-semibold text-slate-700 shadow-lg backdrop-blur hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 dark:hover:bg-slate-800"
          title="Fit technicians on screen"
          aria-label="Fit technicians on screen"
          disabled={!mapInstance}
        >
          <Scan className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute left-4 bottom-32 z-1200">
        <button
          type="button"
          onClick={openGeocoderSearch}
          className="rounded-lg border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-lg backdrop-blur hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 dark:hover:bg-slate-800"
          title="Search map location"
          aria-label="Search map location"
          disabled={!mapInstance}
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute left-4 bottom-20 z-1200 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            if (!mapInstance) {
              return;
            }
            const nextZoom = Math.min((mapInstance.getMaxZoom() || 20), mapInstance.getZoom() + 1);
            mapInstance.flyTo(mapInstance.getCenter(), nextZoom, { animate: true });
          }}
          className="rounded-lg border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-lg backdrop-blur hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 dark:hover:bg-slate-800"
          title="Zoom in"
          aria-label="Zoom in"
          disabled={!mapInstance}
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (!mapInstance) {
              return;
            }
            const nextZoom = Math.max((mapInstance.getMinZoom() || 1), mapInstance.getZoom() - 1);
            mapInstance.flyTo(mapInstance.getCenter(), nextZoom, { animate: true });
          }}
          className="rounded-lg border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-lg backdrop-blur hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 dark:hover:bg-slate-800"
          title="Zoom out"
          aria-label="Zoom out"
          disabled={!mapInstance}
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute left-4 top-4 z-1200">
        <div className={`rounded-2xl border border-white/20 bg-slate-900/78 text-white shadow-lg backdrop-blur-md transition-all ${isLegendCollapsed ? 'w-12' : 'w-56'}`}>
          <div className="flex items-center justify-between p-2.5">
            {!isLegendCollapsed && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">Legend</p>}
            <button
              type="button"
              onClick={() => setIsLegendCollapsed((value) => !value)}
              className="rounded-lg border border-white/20 bg-white/10 p-1 text-white hover:bg-white/20"
              aria-label={isLegendCollapsed ? 'Expand legend' : 'Collapse legend'}
              title={isLegendCollapsed ? 'Expand legend' : 'Collapse legend'}
            >
              {isLegendCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {!isLegendCollapsed && (
            <div className="space-y-2 px-3 pb-3">
              {displayedTechnicianStatuses.length ? displayedTechnicianStatuses.map((status) => (
                <div key={status} className="flex items-center gap-2.5 text-xs text-slate-100">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getStatusColor(status) }} />
                  <span>{getStatusText(status)}</span>
                </div>
              )) : (
                <p className="text-xs text-slate-300">No technician statuses in current filter.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`drawer-panel absolute right-0 top-0 z-1100 h-full overflow-hidden border-l border-slate-200/30 bg-white/85 shadow-2xl transition-transform duration-300 dark:border-slate-800/60 dark:bg-slate-950/90 ${activeSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
        <button
          type="button"
          onClick={() => setActiveSidebar(null)}
          className="absolute left-0 top-0 z-20 h-full w-10 bg-linear-to-r from-slate-900/12 to-transparent text-slate-700 hover:from-slate-900/20 dark:text-slate-200"
          title="Close sidebar"
          aria-label="Close sidebar"
        >
          <span className="flex h-full w-full items-center justify-center">
            <ChevronRight className="h-5 w-5" />
          </span>
        </button>

        <div className="h-full p-4 pl-6">
          <div className="flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-4 dark:border-slate-800/60 dark:bg-slate-950/90">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{activeSidebar === 'technician' ? 'Technician' : 'User'}</h2>
              {activeSidebar === 'technician' && selectedTechnician && (
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: getStatusColor(selectedTechnician.status) }}
                >
                  {getStatusText(selectedTechnician.status)}
                </span>
              )}
              {activeSidebar === 'user' && selectedUser && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">#{selectedUser.booking_id}</span>}
            </div>

            {activeSidebar === 'user' ? (
              <>
                <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-800/60 dark:bg-slate-900/70">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Filter users</label>
                  <input
                    value={userQuery}
                    onChange={(event) => setUserQuery(event.target.value)}
                    placeholder="Search customer name, address, package, service"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                {selectedUser ? (
                  <div className="space-y-4 overflow-auto pr-1">
                    <div className="rounded-2xl border border-slate-200/80 bg-amber-50/70 p-4 shadow-sm dark:border-slate-800/60 dark:bg-amber-950/20">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedUser.customer_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.customer_email}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">#{selectedUser.booking_id}</p>
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{selectedUser.address_line}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.package_name} · {selectedUser.service_name}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <DetailButton
                        label="Focus on map"
                        variant="primary"
                        onClick={() => {
                          setActiveSidebar('user');
                          focusMapOnPoint(mapInstance, selectedUserCoordinates.lat, selectedUserCoordinates.lng);
                        }}
                      />
                      <DetailButton
                        label={hasAssignedTechnicianForSelectedUser ? 'Show technician' : 'Assign technician'}
                        onClick={() => {
                          if (hasAssignedTechnicianForSelectedUser) {
                            setActiveSidebar('technician');
                            focusMapOnPoint(mapInstance, selectedTechnicianCoordinates.lat, selectedTechnicianCoordinates.lng);
                            return;
                          }

                          window.dispatchEvent(
                            new CustomEvent('admin:navigate', {
                              detail: { view: 'orders', focusOrderId: selectedUser.booking_id },
                            }),
                          );
                        }}
                      />
                      <DetailButton label="Copy address" onClick={() => navigator.clipboard.writeText(selectedUser.address_line)} />
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800/60 dark:bg-slate-900/80">
                      <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <p><span className="font-semibold">Status:</span> {selectedUser.status}</p>
                        <p><span className="font-semibold">Phone:</span> {selectedUser.customer_phone || 'N/A'}</p>
                        <p><span className="font-semibold">Building:</span> {selectedUser.building_name || 'N/A'}</p>
                        <p><span className="font-semibold">Technician:</span> {selectedUser.technician_name || 'Unassigned'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No user booking selected.</p>
                )}

                <div className="mt-auto flex-1 overflow-auto pr-1">
                  <div className="space-y-3">
                    {filteredUsers.length ? filteredUsers.map((user) => (
                      <button
                        key={user.booking_id}
                        type="button"
                        onClick={() => {
                          setSelectedUserBookingId(user.booking_id);
                          setActiveSidebar('user');
                        }}
                        className={`w-full rounded-2xl border p-4 text-left transition ${selectedUser?.booking_id === user.booking_id ? 'border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/30' : 'border-slate-200/80 bg-white hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-950/60 dark:hover:bg-slate-900'}`}
                      >
                        <p className="font-semibold text-slate-900 dark:text-white">{user.customer_name}</p>
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">#{user.booking_id}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.address_line}</p>
                      </button>
                    )) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No customer locations matched your search.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-800/60 dark:bg-slate-900/70">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Filter technicians</label>
                  <input
                    value={technicianQuery}
                    onChange={(event) => setTechnicianQuery(event.target.value)}
                    placeholder="Search technician name, email, status, address"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                {selectedTechnician ? (
                  <div className="space-y-4 overflow-auto pr-1">
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/80">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedTechnician.full_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedTechnician.email}</p>
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{selectedTechnician.booking_address}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedTechnician.location_source === 'live' ? 'Live GPS feed' : 'Booking destination'}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <DetailButton
                        label="Focus on map"
                        variant="primary"
                        onClick={() => {
                          setActiveSidebar('technician');
                          focusMapOnPoint(mapInstance, selectedTechnicianCoordinates.lat, selectedTechnicianCoordinates.lng);
                        }}
                      />
                      <DetailButton
                        label="Show user"
                        onClick={() => {
                          setActiveSidebar('user');
                          focusMapOnPoint(mapInstance, selectedUserCoordinates.lat, selectedUserCoordinates.lng);
                        }}
                      />
                      <DetailButton label="Copy coordinates" onClick={() => navigator.clipboard.writeText(`${selectedTechnician.latitude ?? ''}, ${selectedTechnician.longitude ?? ''}`)} />
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800/60 dark:bg-slate-900/80">
                      <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <p><span className="font-semibold">Current jobs:</span> {selectedTechnician.current_jobs}</p>
                        <p><span className="font-semibold">Latest booking:</span> {selectedTechnician.latest_booking_id ?? 'N/A'}</p>
                        <p><span className="font-semibold">Recorded:</span> {selectedTechnician.location_recorded_at ? new Date(selectedTechnician.location_recorded_at).toLocaleString() : 'N/A'}</p>
                        <p><span className="font-semibold">Location source:</span> {selectedTechnician.location_source}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No technician selected.</p>
                )}

                <div className="mt-auto flex-1 overflow-auto pr-1">
                  <div className="space-y-3">
                    {filteredTechnicians.length ? filteredTechnicians.map((technician) => (
                      <button
                        key={technician.id}
                        type="button"
                        onClick={() => {
                          setSelectedTechnicianId(technician.id);
                          setActiveSidebar('technician');
                        }}
                        className={`w-full rounded-2xl border p-4 text-left transition ${selectedTechnician?.id === technician.id ? 'border-teal-300 bg-teal-50 dark:border-teal-700/60 dark:bg-teal-950/30' : 'border-slate-200/80 bg-white hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-950/60 dark:hover:bg-slate-900'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{technician.full_name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{technician.booking_address}</p>
                          </div>
                          <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-white" style={{ backgroundColor: getStatusColor(technician.status) }}>
                            {getStatusText(technician.status)}
                          </span>
                        </div>
                      </button>
                    )) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No technicians matched your search.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
