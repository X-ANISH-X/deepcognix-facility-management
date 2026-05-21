import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';
import { Check, ChevronLeft, ChevronRight, Minus, Plus, Scan, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { mockApi } from '@/app/services/mockApi';

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

const LEGEND_STORAGE_KEY = 'admin-technician-tracking-legend-state-v1';
const DEFAULT_TECHNICIAN_STATUSES: TechnicianLocation['status'][] = ['available', 'assigned', 'enroute', 'onsite', 'offline'];
const DEFAULT_BOOKING_STATUSES = ['submitted', 'assigned', 'in_progress', 'admin_review_pending', 'completed'];
const USER_STATUS_FILTERS = [...DEFAULT_BOOKING_STATUSES];

type LegendState = {
  isLegendCollapsed: boolean;
  visibleTechnicianStatuses: TechnicianLocation['status'][];
  visibleBookingStatuses: string[];
};

function readLegendState(): LegendState {
  const fallback: LegendState = {
    isLegendCollapsed: false,
    visibleTechnicianStatuses: [...DEFAULT_TECHNICIAN_STATUSES],
    visibleBookingStatuses: [...DEFAULT_BOOKING_STATUSES],
  };

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const rawState = window.localStorage.getItem(LEGEND_STORAGE_KEY);
    if (!rawState) {
      return fallback;
    }

    const parsed = JSON.parse(rawState) as Partial<LegendState>;
    const technicianSet = new Set<string>(DEFAULT_TECHNICIAN_STATUSES);
    const bookingSet = new Set<string>(DEFAULT_BOOKING_STATUSES);

    const visibleTechnicianStatuses = Array.isArray(parsed.visibleTechnicianStatuses)
      ? parsed.visibleTechnicianStatuses.filter((value): value is TechnicianLocation['status'] => (
        typeof value === 'string' && technicianSet.has(value)
      ))
      : [];

    const visibleBookingStatuses = Array.isArray(parsed.visibleBookingStatuses)
      ? parsed.visibleBookingStatuses
        .map((value) => normalizeBookingLegendStatus(String(value).toLowerCase()))
        .filter((value) => bookingSet.has(value))
      : [];

    return {
      isLegendCollapsed: Boolean(parsed.isLegendCollapsed),
      visibleTechnicianStatuses: visibleTechnicianStatuses.length ? visibleTechnicianStatuses : [...DEFAULT_TECHNICIAN_STATUSES],
      visibleBookingStatuses: visibleBookingStatuses.length ? visibleBookingStatuses : [...DEFAULT_BOOKING_STATUSES],
    };
  } catch (error) {
    return fallback;
  }
}

function saveLegendState(state: LegendState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LEGEND_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // ignore storage failures
  }
}

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

function getTechnicianStatusPillClass(status: TechnicianLocation['status']): string {
  switch (status) {
    case 'available':
      return 'border-emerald-200 bg-emerald-50 text-emerald-500 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200';
    case 'assigned':
      return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-200';
    case 'enroute':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200';
    case 'onsite':
      return 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/15 dark:text-teal-200';
    case 'offline':
      return 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';
  }
}

function getBookingStatusColor(status?: string | null): string {
  switch ((status || '').toLowerCase()) {
    case 'submitted':
    case 'pending':
    case 'approved':
      return '#f97316';
    case 'assigned':
      return '#8b5cf6';
    case 'in_progress':
    case 'in-progress':
      return '#f59e0b';
    case 'completion_requested':
    case 'admin_review_pending':
      return '#06b6d4';
    // Treat customer review the same as completion requested in the admin UI
    case 'customer_review_pending':
      return '#06b6d4';
    case 'completed':
      return '#10b981';
    default:
      return '#6b7280';
  }
}

function getBookingStatusPillClass(status?: string | null): string {
  switch ((status || '').toLowerCase()) {
    case 'submitted':
    case 'pending':
    case 'approved':
      return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-200';
    case 'assigned':
      return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-200';
    case 'in_progress':
    case 'in-progress':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200';
    case 'completion_requested':
    case 'admin_review_pending':
    case 'customer_review_pending':
      return 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-200';
    case 'completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';
  }
}

function getBookingStatusText(status?: string | null): string {
  if (!status) return 'Unknown';
  switch (status.toLowerCase()) {
    case 'submitted':
    case 'pending':
      return 'Submitted';
    case 'approved':
      // Treat 'approved' as 'Submitted' for admin UI (no auto-approval workflow)
      return 'Submitted';
    case 'assigned':
      return 'Assigned';
    case 'in_progress':
    case 'in-progress':
      return 'In Progress';
    case 'completion_requested':
    case 'admin_review_pending':
    case 'customer_review_pending':
      // Merge customer review into completion requested for admin display
      return 'Completion Requested';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
}

function normalizeBookingLegendStatus(status: string): string {
  switch (status) {
    case 'completion_requested':
    case 'customer_review_pending':
      return 'admin_review_pending';
    case 'approved':
    case 'submitted':
    case 'pending':
      return 'submitted';
    case 'in-progress':
      return 'in_progress';
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
  const statusColor = getBookingStatusColor(user.status);
  return L.divIcon({
    className: 'user-div-icon',
    html: `
      <div class="user-marker-wrap">
        <div class="user-marker-ring" style="background:${statusColor};"></div>
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
      geocoder: (options: { defaultMarkGeocode?: boolean; position?: string }) => GeocoderControlInstance;
    }).geocoder({
      defaultMarkGeocode: false,
      position: 'topleft',
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

function DetailButton({
  label,
  onClick,
  variant = 'default',
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary';
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${disabled ? 'cursor-not-allowed opacity-55' : ''} ${variant === 'primary' ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'}`}
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
  const [visibleUserStatuses, setVisibleUserStatuses] = useState<string[]>([...DEFAULT_BOOKING_STATUSES]);
  const [activeSidebar, setActiveSidebar] = useState<'user' | 'technician' | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [initialLegendState] = useState<LegendState>(() => readLegendState());
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(initialLegendState.isLegendCollapsed);
  const [visibleTechnicianStatuses, setVisibleTechnicianStatuses] = useState<TechnicianLocation['status'][]>(initialLegendState.visibleTechnicianStatuses);
  const [visibleBookingStatuses, setVisibleBookingStatuses] = useState<string[]>(initialLegendState.visibleBookingStatuses);

  useEffect(() => {
    saveLegendState({
      isLegendCollapsed,
      visibleTechnicianStatuses,
      visibleBookingStatuses,
    });
  }, [isLegendCollapsed, visibleTechnicianStatuses, visibleBookingStatuses]);

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
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = mockApi.subscribeRealtime((event) => {
      if (event.event === 'technician.location_updated') {
        void loadMapData(true);
      }
    });

    return () => {
      unsubscribe();
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
        technician.status,
        technician.location_source,
        technician.latest_booking_status,
        technician.booking_address,
      ].some((value) => String(value ?? '').toLowerCase().includes(needle));
    });
  }, [technicianQuery, technicians]);

  const filteredUsers = useMemo(() => {
    const needle = userQuery.trim().toLowerCase();
    if (!needle) {
      return users.filter((user) => visibleUserStatuses.includes(normalizeBookingLegendStatus(String(user.status).toLowerCase())));
    }

    return users.filter((user) => {
      const normalizedStatus = normalizeBookingLegendStatus(String(user.status).toLowerCase());
      if (!visibleUserStatuses.includes(normalizedStatus)) {
        return false;
      }

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
  }, [userQuery, users, visibleUserStatuses]);

  const toggleUserStatus = (status: string) => {
    setVisibleUserStatuses((current) => (
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status]
    ));
  };

  const allUserStatusesVisible = visibleUserStatuses.length === USER_STATUS_FILTERS.length;

  const toggleAllUserStatuses = () => {
    setVisibleUserStatuses(allUserStatusesVisible ? [] : [...USER_STATUS_FILTERS]);
  };

  const toggleTechnicianStatus = (status: TechnicianLocation['status']) => {
    setVisibleTechnicianStatuses((current) => (
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status]
    ));
  };

  const toggleBookingStatus = (status: string) => {
    setVisibleBookingStatuses((current) => (
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status]
    ));
  };

  const allTechnicianStatusesVisible = visibleTechnicianStatuses.length === DEFAULT_TECHNICIAN_STATUSES.length;
  const allBookingStatusesVisible = visibleBookingStatuses.length === DEFAULT_BOOKING_STATUSES.length;

  const toggleAllTechnicianStatuses = () => {
    setVisibleTechnicianStatuses(allTechnicianStatusesVisible ? [] : [...DEFAULT_TECHNICIAN_STATUSES]);
  };

  const toggleAllBookingStatuses = () => {
    setVisibleBookingStatuses(allBookingStatusesVisible ? [] : [...DEFAULT_BOOKING_STATUSES]);
  };

  const visibleTechnicians = useMemo(
    () => filteredTechnicians.filter((technician) => visibleTechnicianStatuses.includes(technician.status)),
    [filteredTechnicians, visibleTechnicianStatuses],
  );

  const visibleUsers = useMemo(
    () => filteredUsers.filter((user) => visibleBookingStatuses.includes(normalizeBookingLegendStatus(String(user.status).toLowerCase()))),
    [filteredUsers, visibleBookingStatuses],
  );

  const mapMarkers = useMemo(() => {
    const technicianMarkers = visibleTechnicians
      .filter((technician) => Number.isFinite(technician.latitude) && Number.isFinite(technician.longitude))
      .map((technician) => ({
        kind: 'technician' as const,
        id: `tech-${technician.id}`,
        lat: Number(technician.latitude),
        lng: Number(technician.longitude),
        technician,
      }));

    const userMarkers = visibleUsers
      .filter((user) => Number.isFinite(user.latitude) && Number.isFinite(user.longitude))
      .map((user) => ({
        kind: 'user' as const,
        id: `user-${user.booking_id}`,
        lat: Number(user.latitude),
        lng: Number(user.longitude),
        user,
      }));

    return [...technicianMarkers, ...userMarkers];
  }, [visibleTechnicians, visibleUsers]);

  useEffect(() => {
    if (selectedTechnicianId === null && selectedUserBookingId === null) {
      return;
    }

    if (selectedTechnicianId !== null && !visibleTechnicians.some((item) => item.id === selectedTechnicianId)) {
      setSelectedTechnicianId(visibleTechnicians[0]?.id ?? null);
    }

    if (selectedUserBookingId !== null && !visibleUsers.some((item) => item.booking_id === selectedUserBookingId)) {
      setSelectedUserBookingId(visibleUsers[0]?.booking_id ?? null);
    }
  }, [visibleTechnicians, visibleUsers, selectedTechnicianId, selectedUserBookingId]);

  const selectedTechnician = useMemo(
    () => visibleTechnicians.find((item) => item.id === selectedTechnicianId) ?? visibleTechnicians[0] ?? null,
    [visibleTechnicians, selectedTechnicianId],
  );

  const [showTechnicianDetails, setShowTechnicianDetails] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  const selectedUser = useMemo(
    () => visibleUsers.find((item) => item.booking_id === selectedUserBookingId) ?? visibleUsers[0] ?? null,
    [visibleUsers, selectedUserBookingId],
  );

  const selectedUserCoordinates = useMemo(
    () => ({ lat: selectedUser?.latitude ?? null, lng: selectedUser?.longitude ?? null }),
    [selectedUser],
  );

  const hasSelectedUserCoordinates = Number.isFinite(selectedUserCoordinates.lat) && Number.isFinite(selectedUserCoordinates.lng);

  const selectedTechnicianCoordinates = useMemo(
    () => ({ lat: selectedTechnician?.latitude ?? null, lng: selectedTechnician?.longitude ?? null }),
    [selectedTechnician],
  );

  const technicianFitMarkers = useMemo(
    () => visibleTechnicians
      .filter((technician) => Number.isFinite(technician.latitude) && Number.isFinite(technician.longitude))
      .map((technician) => ({ lat: Number(technician.latitude), lng: Number(technician.longitude) })),
    [visibleTechnicians],
  );

  const hasAssignedTechnicianForSelectedUser = useMemo(
    () => Boolean(selectedUser?.technician_name && selectedUser.technician_name.trim() && selectedUser.technician_name !== 'Unassigned'),
    [selectedUser],
  );

  const handleUserSelection = (bookingId: number) => {
    setSelectedUserBookingId(bookingId);
    setSelectedTechnicianId(null);
    setShowUserDetails(true);
    setShowTechnicianDetails(false);
    setActiveSidebar('user');
  };

  const handleTechnicianSelection = (technicianId: number) => {
    setSelectedTechnicianId(technicianId);
    setSelectedUserBookingId(null);
    setShowTechnicianDetails(true);
    setShowUserDetails(false);
    setActiveSidebar('technician');
  };

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
    const present = new Set(visibleTechnicianStatuses);
    return statusOrder.map((status) => ({ status, present: present.has(status) }));
  }, [visibleTechnicianStatuses]);

  const displayedBookingStatuses = useMemo(() => {
    const order = [
      'submitted',
      'assigned',
      'in_progress',
      'admin_review_pending',
      'completed',
    ];
    const present = new Set<string>();
    visibleTechnicians.forEach((t) => {
      if (t.latest_booking_status) present.add(String(t.latest_booking_status).toLowerCase());
    });
    visibleUsers.forEach((u) => {
      if (u.status) present.add(normalizeBookingLegendStatus(String(u.status).toLowerCase()));
    });

    return order.map((status) => ({ status, present: present.has(status) && visibleBookingStatuses.includes(status) }));
  }, [visibleTechnicians, visibleUsers, visibleBookingStatuses]);

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
    <div className={`relative z-0 isolate h-[calc(100vh-10.5rem)] min-h-155 overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950 shadow-2xl ${isLightMode ? 'light-mode' : ''}`}>
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
        .user-marker-ring {
          position: absolute;
          width: 42px;
          height: 42px;
          border-radius: 9999px;
          z-index: 1;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
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
          z-index: 2;
        }
        .drawer-panel {
          width: min(560px, calc(100% - 72px));
          backdrop-filter: blur(16px);
        }
        .drawer-collapsed {
          width: 56px;
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
        /* Geocoder control theme overrides to blend with app theme */
        .leaflet-control-geocoder {
          background: rgba(15,23,42,0.78) !important;
          border-radius: 0.75rem !important;
          border: 1px solid rgba(255,255,255,0.06) !important;
          box-shadow: 0 6px 18px rgba(2,6,23,0.6) !important;
          padding: 6px !important;
        }
        .leaflet-control-geocoder .leaflet-control-geocoder-form {
          display: flex;
          gap: 6px;
          align-items: center;
          padding: 0;
          background: transparent !important;
        }
        .leaflet-control-geocoder input.leaflet-control-geocoder-input {
          background: transparent !important;
          color: #e6eef8 !important;
          border: none !important;
          outline: none !important;
          padding: 6px 8px !important;
          min-width: 160px !important;
          font-size: 13px !important;
        }
        .leaflet-control-geocoder button.leaflet-control-geocoder-button {
          background: rgba(255,255,255,0.04) !important;
          color: #cbd5e1 !important;
          border: 1px solid rgba(255,255,255,0.03) !important;
          padding: 6px 8px !important;
          border-radius: 8px !important;
        }
        .leaflet-control-geocoder .leaflet-control-geocoder-icon {
          display: none !important;
        }
        /* Light mode overrides when the container has .light-mode */
        .light-mode .leaflet-control-geocoder {
          background: rgba(255,255,255,0.96) !important;
          border-radius: 0.5rem !important;
          border: 1px solid rgba(2,6,23,0.06) !important;
          box-shadow: 0 2px 6px rgba(2,6,23,0.06) !important;
          padding: 6px !important;
        }
        .light-mode .leaflet-control-geocoder .leaflet-control-geocoder-form {
          background: transparent !important;
        }
        .light-mode .leaflet-control-geocoder input.leaflet-control-geocoder-input {
          color: #0f172a !important;
          background: rgba(255,255,255,0.96) !important;
          border-radius: 8px !important;
          padding-left: 8px !important;
        }
        .light-mode .leaflet-control-geocoder button.leaflet-control-geocoder-button {
          background: rgba(2,6,23,0.03) !important;
          color: #0f172a !important;
          border: 1px solid rgba(2,6,23,0.04) !important;
        }
        .light-mode .legend-panel {
          background: rgba(255,255,255,0.96) !important;
          color: #0f172a !important;
          border: 1px solid rgba(2,6,23,0.06) !important;
          box-shadow: 0 2px 6px rgba(2,6,23,0.06) !important;
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
                    handleTechnicianSelection(marker.technician.id);
                  } else {
                    handleUserSelection(marker.user.booking_id);
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

      {/* Collapsed semi-transparent vertical bar to open the sidebar */}
      {!activeSidebar && (
        <div className="absolute right-0 top-1/2 z-1200 -translate-y-1/2">
            <button
              type="button"
              onClick={() => setActiveSidebar('technician')}
              title="Open sidebar"
              aria-label="Open sidebar"
              className={`h-24 w-10 flex items-center justify-center rounded-l-full shadow-md transition-colors ${isLightMode ? 'bg-white/95 text-slate-700 border border-slate-200/60 hover:bg-white' : 'bg-slate-800/75 hover:bg-slate-700/80 text-white backdrop-blur-md'}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
      )}

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

      <div className="absolute left-4 top-1/2 z-1200 -translate-y-1/2">
        <div className={`legend-panel rounded-2xl transition-all ${isLegendCollapsed ? 'w-12' : 'w-56'} ${isLightMode ? 'border border-slate-200 bg-white text-slate-900 shadow-sm' : 'border border-white/20 bg-slate-900/78 text-white shadow-lg backdrop-blur-md'}`}>
            <div className="flex items-center justify-between p-2.5">
              {!isLegendCollapsed && <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${isLightMode ? 'text-slate-700' : 'text-slate-200'}`}>Legend</p>}
              <div className="flex items-center gap-2">
                {/* Legend theme follows global app theme; removed manual toggle */}
              <button
                type="button"
                onClick={() => setIsLegendCollapsed((value) => !value)}
                className={`rounded-lg p-1 ${isLightMode ? 'bg-white/10 text-slate-900' : 'bg-white/10 text-white'}`}
                aria-label={isLegendCollapsed ? 'Expand legend' : 'Collapse legend'}
                title={isLegendCollapsed ? 'Expand legend' : 'Collapse legend'}
              >
                {isLegendCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              </div>
            </div>

          {!isLegendCollapsed && (
            <div className="space-y-2 px-3 pb-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Technician statuses</p>
                  <button
                    type="button"
                    onClick={toggleAllTechnicianStatuses}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${isLightMode ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-100 hover:bg-slate-700'}`}
                  >
                    {allTechnicianStatusesVisible ? <Check className="h-3 w-3 " /> : <X className="h-3 w-3" />}
                    {allTechnicianStatusesVisible ? '' : ''}
                  </button>
                </div>
                {displayedTechnicianStatuses.map((statusItem) => (
                  <button
                    key={statusItem.status}
                    type="button"
                    onClick={() => toggleTechnicianStatus(statusItem.status)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-left text-xs transition hover:bg-slate-500/5 ${statusItem.present ? (isLightMode ? 'text-slate-900' : 'text-slate-100') : 'opacity-45'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getStatusColor(statusItem.status) }} />
                      <span>{getStatusText(statusItem.status)}</span>
                    </span>
                    {statusItem.present ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>

              {displayedBookingStatuses.length ? (
                <div className="pt-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Booking statuses</p>
                    <button
                      type="button"
                      onClick={toggleAllBookingStatuses}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${isLightMode ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-100 hover:bg-slate-700'}`}
                    >
                      {allBookingStatusesVisible ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {allBookingStatusesVisible ? '' : ''}
                    </button>
                  </div>
                  <div className="mt-1 space-y-1">
                    {displayedBookingStatuses.map((statusItem) => (
                      <button
                        key={statusItem.status}
                        type="button"
                        onClick={() => toggleBookingStatus(statusItem.status)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-left text-xs transition hover:bg-slate-500/5 ${statusItem.present ? (isLightMode ? 'text-slate-900' : 'text-slate-100') : 'opacity-45'}`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getBookingStatusColor(statusItem.status) }} />
                          <span>{getBookingStatusText(statusItem.status)}</span>
                        </span>
                        {statusItem.present ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className={`drawer-panel absolute right-0 top-0 z-1100 h-full overflow-hidden shadow-2xl transition-transform duration-300 ${activeSidebar ? 'translate-x-0' : 'translate-x-full'} ${isLightMode ? 'border-l border-slate-200/80 bg-white text-slate-900' : 'border-l border-slate-700/40 bg-slate-900/90 text-white'}`}>
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
          <div className={`flex h-full flex-col gap-4 overflow-hidden rounded-3xl p-4 ${isLightMode ? 'border border-slate-200/60 bg-white text-slate-900' : 'border border-slate-700/60 bg-slate-900/90 dark:border-slate-800/60 dark:bg-slate-950/90'}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSidebar('technician')}
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${activeSidebar === 'technician' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}
                >
                  Technician
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSidebar('user')}
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${activeSidebar === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}
                >
                  User
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setActiveSidebar('user')}
                  className="rounded-full px-1 py-1 pr-2.5  text-sm font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <div className="flex items-center gap-2">
                    {activeSidebar === 'user' ? (
                      <>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap"
                          style={{ backgroundColor: getBookingStatusColor(selectedUser?.status) }}
                        >
                          {getBookingStatusText(selectedUser?.status)}
                        </span>
                        <span className="text-xs font-semibold">#{selectedUser?.booking_id ?? ''}</span>
                      </>
                    ) : selectedTechnician ? (
                      <>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap"
                          style={{ backgroundColor: getStatusColor(selectedTechnician.status) }}
                        >
                          {getStatusText(selectedTechnician.status)}
                        </span>
                        <span className="text-xs font-semibold">#{selectedTechnician.latest_booking_id ?? ''}</span>
                      </>
                    ) : (
                      <>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap"
                          style={{ backgroundColor: getBookingStatusColor(undefined) }}
                        >
                          {getBookingStatusText(undefined)}
                        </span>
                        <span className="text-xs font-semibold">#</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
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
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={toggleAllUserStatuses}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${allUserStatusesVisible ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                    >
                      {allUserStatusesVisible ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {allUserStatusesVisible ? 'Clear all' : 'Show all'}
                    </button>
                    {USER_STATUS_FILTERS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => toggleUserStatus(status)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${visibleUserStatuses.includes(status) ? getBookingStatusPillClass(status) : 'border-slate-200 bg-white text-slate-500 opacity-55 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getBookingStatusColor(status) }} />
                        {getBookingStatusText(status)}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedUser ? (
                  <div className="space-y-4 overflow-auto pr-1">
                    <div className="rounded-2xl border border-slate-200/80 bg-amber-50/70 p-4 shadow-sm dark:border-slate-800/60 dark:bg-amber-950/20">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedUser.customer_name}</p>
                          <div className="mt-1 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                            <p><span className="font-semibold text-slate-700 dark:text-slate-300">Email:</span> {selectedUser.customer_email}</p>
                            <p><span className="font-semibold text-slate-700 dark:text-slate-300">Order ID: </span> #{selectedUser.booking_id}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getBookingStatusPillClass(selectedUser.status)}`}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getBookingStatusColor(selectedUser.status) }} />
                          {getBookingStatusText(selectedUser.status)}
                        </span>
                      </div>
                      {!hasSelectedUserCoordinates && (
                        <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">No coordinates yet. Address only.</p>
                      )}
                    </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-2">
                          <DetailButton
                            label="Focus on map"
                            variant="primary"
                            disabled={!hasSelectedUserCoordinates}
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
                          <button
                            type="button"
                            onClick={() => setShowUserDetails((v) => !v)}
                            className="rounded-full px-2.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200/60 dark:bg-slate-800 dark:text-white whitespace-nowrap"
                          >
                            {showUserDetails ? 'Hide details' : 'Show details'}
                          </button>
                        </div>

                        {showUserDetails && (
                          <div className={`rounded-2xl p-4 ${showUserDetails ? 'border-amber-300 ring-2 ring-amber-300/30 shadow-lg dark:border-amber-600 dark:ring-amber-600/30' : 'border-slate-200/80 dark:border-slate-800/60'} ${isLightMode ? 'bg-white text-slate-900' : 'bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300'}`}>
                            <div className="grid gap-2 text-sm">
                              <p><span className="font-semibold">Status:</span> {selectedUser.status}</p>
                              <p><span className="font-semibold">Phone:</span> {selectedUser.customer_phone || 'N/A'}</p>
                              <p><span className="font-semibold">Address:</span> {selectedUser.address_line}</p>
                              <p><span className="font-semibold">Package:</span> {selectedUser.package_name}</p>
                              <p><span className="font-semibold">Service:</span> {selectedUser.service_name}</p>
                              <p><span className="font-semibold">Building:</span> {selectedUser.building_name || 'N/A'}</p>
                              <p><span className="font-semibold">Technician:</span> {selectedUser.technician_name || 'Unassigned'}</p>
                            </div>
                          </div>
                        )}
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
                        onClick={() => handleUserSelection(user.booking_id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${selectedUser?.booking_id === user.booking_id ? 'border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/30' : 'border-slate-200/80 bg-white hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-950/60 dark:hover:bg-slate-900'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900 dark:text-white">{user.customer_name}</p>
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${getBookingStatusPillClass(user.status)}`}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getBookingStatusColor(user.status) }} />
                            {getBookingStatusText(user.status)}
                          </span>
                        </div>
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
                  <div className="flex flex-wrap gap-2 pt-1">
                    {displayedTechnicianStatuses.map((statusItem) => (
                      <span
                        key={statusItem.status}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getTechnicianStatusPillClass(statusItem.status)} ${statusItem.present ? '' : 'opacity-45'}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getStatusColor(statusItem.status) }} />
                        {getStatusText(statusItem.status)}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedTechnician ? (
                  <div className="space-y-4 overflow-auto pr-1">
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/80">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedTechnician.full_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedTechnician.email}</p>
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{selectedTechnician.booking_address}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedTechnician.location_source === 'live' ? 'Live GPS feed' : 'Booking destination'}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2">
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
                      <button
                        type="button"
                        onClick={() => setShowTechnicianDetails((v) => !v)}
                        className="rounded-full px-2.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200/60 dark:bg-slate-800 dark:text-white whitespace-nowrap"
                      >
                        {showTechnicianDetails ? 'Hide details' : 'Show details'}
                      </button>
                    </div>

                    {showTechnicianDetails && (
                      <div className={`rounded-2xl p-4 ${showTechnicianDetails ? 'border-amber-200 ring-1 ring-amber-200/20 shadow-sm dark:border-amber-600 dark:ring-amber-600/12' : 'border-slate-200/80 dark:border-slate-800/60'} ${isLightMode ? 'bg-white text-slate-900' : 'bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300'}`}>
                        <div className="grid gap-2 text-sm">
                          <p><span className="font-semibold">Current jobs:</span> {selectedTechnician.current_jobs}</p>
                          <p><span className="font-semibold">Latest booking:</span> {selectedTechnician.latest_booking_id ?? 'N/A'}</p>
                          <p><span className="font-semibold">Recorded:</span> {selectedTechnician.location_recorded_at ? new Date(String(selectedTechnician.location_recorded_at)).toLocaleString() : 'N/A'}</p>
                          <p><span className="font-semibold">Location source:</span> {selectedTechnician.location_source}</p>
                        </div>
                      </div>
                    )}
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
                        onClick={() => handleTechnicianSelection(technician.id)}
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
