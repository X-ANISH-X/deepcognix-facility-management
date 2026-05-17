export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string[];
  status: 'available' | 'assigned' | 'enroute' | 'onsite' | 'offline';
  locationSource: 'live' | 'booking' | 'fallback';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  liveLocation?: {
    lat: number;
    lng: number;
    recordedAt?: string;
  };
  bookingLocation?: {
    lat: number;
    lng: number;
    address: string;
    orderId?: string;
  };
  currentJobs: number;
  completionRate: number;
  avatar: string;
}

export interface WorkOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  packageName?: string;
  serviceType: string;
  packageName?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'approved' | 'assigned' | 'in-progress' | 'completion-requested' | 'rejection-requested' | 'completed' | 'rejected';
  technicianId?: string;
  technicianName?: string;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  buildingName?: string;
  floorNumber?: string;
  apartmentNumber?: string;
  description: string;
  customerNotes?: string;
  preferredTechnician?: string;
  parkingInstructions?: string;
  petWarning?: string;
  callBeforeArrival?: boolean;
  estimatedCost: number;
  actualCost?: number;
  createdAt: string;
  completedAt?: string;
}

export interface BookingTask {
  id: number;
  bookingId: string;
  taskName: string;
  orderIndex: number;
  isCompleted: boolean;
}

export interface CustomerReportRow {
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageName: string;
  amount: number;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  duration: number;
  description: string;
  isActive: boolean;
  color?: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  serviceIds: string[];
  estimatedTimes: Record<string, string>;
  isActive: boolean;
}

export interface KPIData {
  activeWorkOrders: number;
  totalRevenue: number;
  avgCompletionRate: number;
  totalTechnicians: number;
  completedToday: number;
}

export interface RevenueStats {
  totalRevenue: number;
  pendingRevenue: number;
  dailyRevenue: Array<{ date: string; revenue: number }>;
  trendData: Array<{ label: string; revenue: number }>;
  trendPeriod: 'day' | 'week' | 'month' | 'year';
}

export interface PreviousCustomer {
  id: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  lastBookingAt?: string;
  totalBookings?: number;
}

export interface BookingTask {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  completed: boolean;
}

export interface CustomerReportRow {
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageName: string;
  technicianName?: string;
  amount: number;
}

export interface NotificationItem {
  id: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface CreateTechnicianInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface UpdateTechnicianProfileInput {
  fullName?: string;
  email?: string;
  phone?: string;
  status?: Technician['status'];
}

export interface AdminNotificationInput {
  title?: string;
  message: string;
  customerIds?: string[];
}

export interface RealtimeEvent {
  event: string;
  [key: string]: unknown;
}

type Dict = Record<string, unknown>;

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  'http://127.0.0.1:8000';
const TOKEN_KEY = 'admin_token';
const LEGACY_TOKEN_KEY = 'backend_access_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';

let refreshInFlight: Promise<string | null> | null = null;

function getRealtimeWsUrl(): string {
  const trimmed = API_BASE.replace(/\/+$/, '');
  return `${trimmed.replace(/^http/i, 'ws')}/realtime/ws`;
}

function getDefaultCategoryColor(category: string): string {
  const key = category.trim().toLowerCase();
  const colors: Record<string, string> = {
    'general cleaning': '#0f766e',
    'kitchen cleaning': '#d97706',
    'bathroom care': '#0284c7',
    'windows & balcony': '#4f46e5',
    'upholstery & fabrics': '#be185d',
    sanitization: '#059669',
    'premium detailing': '#475569',
    'add-on services': '#ea580c',
    hvac: '#2563eb',
    plumbing: '#16a34a',
    electrical: '#ca8a04',
    cleaning: '#7c3aed',
    security: '#dc2626',
    lighting: '#f59e0b',
  };
  return colors[key] || '#3b82f6';
}

function readToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
}

function readRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function persistAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(LEGACY_TOKEN_KEY, token);
}

function clearStoredAuthTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function tryRefreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  const refreshToken = readRefreshToken();
  if (!refreshToken) {
    return null;
  }

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const payload = (await response.json().catch(() => ({}))) as Dict;
      if (!response.ok) {
        clearStoredAuthTokens();
        return null;
      }

      const nextAccessToken = typeof payload.access_token === 'string' ? payload.access_token : null;
      const nextRefreshToken = typeof payload.refresh_token === 'string' ? payload.refresh_token : null;
      if (!nextAccessToken) {
        clearStoredAuthTokens();
        return null;
      }

      persistAccessToken(nextAccessToken);
      if (nextRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
      }
      return nextAccessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function pickString(obj: Dict, key: string): string {
  const value = obj[key];
  return typeof value === 'string' ? value : '';
}

function pickStringOrNumber(obj: Dict, key: string): string {
  const value = obj[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function pickNumber(obj: Dict, key: string): number {
  const value = obj[key];
  return typeof value === 'number' ? value : Number(value || 0);
}

function pickFirstNumber(obj: Dict, keys: string[], fallback = 0): number {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const parsed = pickNumber(obj, key);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return fallback;
}

function statusFromBackend(raw: string): WorkOrder['status'] {
  if (raw === 'submitted') return 'submitted';
  if (raw === 'approved') return 'approved';
  if (raw === 'assigned') return 'assigned';
  if (raw === 'in_progress') return 'in-progress';
  if (raw === 'customer_review_pending') return 'in-progress';
  if (raw === 'admin_review_pending') return 'completion-requested';
  if (raw === 'completion_requested') return 'completion-requested';
  if (raw === 'rejection_requested') return 'rejection-requested';
  if (raw === 'completed') return 'completed';
  if (raw === 'rejected') return 'rejected';
  if (raw === 'cancelled') return 'rejected';
  return 'submitted';
}

function statusToBackend(raw: WorkOrder['status']): string {
  if (raw === 'in-progress') return 'in_progress';
  if (raw === 'completion-requested') return 'completion_requested';
  if (raw === 'rejection-requested') return 'rejection_requested';
  if (raw === 'rejected') return 'rejected';
  return raw;
}

function toBackendTimeSlot(raw: string | undefined): string {
  const allowedSlots = new Set(['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM']);

  const formatSlot = (hour24: number, minute: number): string => {
    const clampedHour = Math.max(0, Math.min(23, hour24));
    const clampedMinute = Math.max(0, Math.min(59, minute));
    const period = clampedHour >= 12 ? 'PM' : 'AM';
    const hour12 = clampedHour % 12 === 0 ? 12 : clampedHour % 12;
    return `${String(hour12).padStart(2, '0')}:${String(clampedMinute).padStart(2, '0')} ${period}`;
  };

  if (!raw) {
    return '09:00 AM';
  }

  const value = raw.trim();
  if (allowedSlots.has(value)) {
    return value;
  }

  // HH:MM:SS
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    const [hh, mm] = value.split(':').map(Number);
    return formatSlot(hh, mm);
  }

  // HH:MM from <input type="time">
  if (/^\d{2}:\d{2}$/.test(value)) {
    const [hh, mm] = value.split(':').map(Number);
    return formatSlot(hh, mm);
  }

  // Handle AM/PM values if passed in from a select label.
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let hour = Number(match[1]);
    const minute = match[2];
    const period = match[3].toUpperCase();
    if (period === 'PM' && hour < 12) {
      hour += 12;
    }
    if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    return formatSlot(hour, Number(minute));
  }

  return '09:00 AM';
}

function toAvatar(name: string): string {
  const bits = name.split(' ').filter(Boolean);
  if (bits.length === 0) return 'U';
  if (bits.length === 1) return bits[0].slice(0, 2).toUpperCase();
  return `${bits[0][0] ?? ''}${bits[1][0] ?? ''}`.toUpperCase();
}

async function request<T>(path: string, init?: RequestInit, requireAuth = false): Promise<T> {
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };

  const execute = (token?: string) => {
    const headers = { ...baseHeaders };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    });
  };

  let tokenForRequest: string | null = null;
  if (requireAuth) {
    tokenForRequest = readToken();
    if (!tokenForRequest) {
      tokenForRequest = await tryRefreshAccessToken();
    }
    if (!tokenForRequest) {
      throw new Error('Missing auth token. Please sign in again.');
    }
  }

  let response = await execute(tokenForRequest || undefined);

  if (requireAuth && response.status === 401) {
    const refreshedToken = await tryRefreshAccessToken();
    if (refreshedToken) {
      response = await execute(refreshedToken);
    }
  }

  const body = (await response.json().catch(() => ({}))) as Dict;
  if (!response.ok) {
    if (response.status === 401 && requireAuth && path !== '/auth/refresh') {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const retryHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(init?.headers as Record<string, string> | undefined),
          Authorization: `Bearer ${readToken()}`,
        };

        const retryResponse = await fetch(`${API_BASE}${path}`, {
          ...init,
          headers: retryHeaders,
          credentials: 'include',
        });

        const retryBody = (await retryResponse.json().catch(() => ({}))) as Dict;
        if (retryResponse.ok) {
          return retryBody as T;
        }

        if (retryResponse.status === 401) {
          emitSessionExpired();
        }

        const retryDetail = typeof retryBody.detail === 'string'
          ? retryBody.detail
          : typeof retryBody.error === 'string'
            ? retryBody.error
            : `Request failed (${retryResponse.status})`;
        throw new Error(retryDetail);
      }

      emitSessionExpired();
    }

    const detail = typeof body.detail === 'string' ? body.detail : typeof body.error === 'string' ? body.error : `Request failed (${response.status})`;
    throw new Error(detail);
  }

  return body as T;
}

function mapTechnician(item: Dict): Technician {
  const name = pickString(item, 'full_name') || pickString(item, 'name') || 'Technician';
  const lat = item.latitude === null || item.latitude === undefined ? 0 : pickNumber(item, 'latitude');
  const lng = item.longitude === null || item.longitude === undefined ? 0 : pickNumber(item, 'longitude');
  const liveLat = item.live_latitude === null || item.live_latitude === undefined ? undefined : pickNumber(item, 'live_latitude');
  const liveLng = item.live_longitude === null || item.live_longitude === undefined ? undefined : pickNumber(item, 'live_longitude');
  const bookingLat = item.booking_latitude === null || item.booking_latitude === undefined ? undefined : pickNumber(item, 'booking_latitude');
  const bookingLng = item.booking_longitude === null || item.booking_longitude === undefined ? undefined : pickNumber(item, 'booking_longitude');
  const rawStatus = pickString(item, 'status');
  const mappedStatus: Technician['status'] =
    rawStatus === 'assigned' || rawStatus === 'enroute' || rawStatus === 'onsite' || rawStatus === 'offline' || rawStatus === 'available'
      ? rawStatus
      : rawStatus === 'on-job'
        ? 'onsite'
      : (item.is_active === false ? 'offline' : 'available');

  const specialties = Array.isArray(item.specialties)
    ? item.specialties.map((value) => String(value)).filter(Boolean)
    : [];

  const locationSource = pickString(item, 'location_source') as Technician['locationSource'] | '';
  const normalizedLocationSource: Technician['locationSource'] =
    locationSource === 'live' || locationSource === 'booking' || locationSource === 'fallback'
      ? locationSource
      : liveLat !== undefined && liveLng !== undefined
        ? 'live'
        : bookingLat !== undefined && bookingLng !== undefined
          ? 'booking'
          : 'fallback';

  return {
    id: String(item.id ?? ''),
    name,
    email: pickString(item, 'email'),
    phone: pickString(item, 'phone_number') || pickString(item, 'phone'),
    specialty: specialties,
    status: mappedStatus,
    locationSource: normalizedLocationSource,
    location: {
      lat,
      lng,
      address: pickString(item, 'location_address') || pickString(item, 'location') || pickString(item, 'address') || 'N/A',
    },
    liveLocation: liveLat !== undefined && liveLng !== undefined
      ? {
          lat: liveLat,
          lng: liveLng,
          recordedAt: pickString(item, 'location_recorded_at') || undefined,
        }
      : undefined,
    bookingLocation: bookingLat !== undefined && bookingLng !== undefined
      ? {
          lat: bookingLat,
          lng: bookingLng,
          address: pickString(item, 'booking_address') || pickString(item, 'location_address') || 'N/A',
          orderId: pickStringOrNumber(item, 'latest_booking_id') || pickStringOrNumber(item, 'booking_id') || undefined,
        }
      : undefined,
    currentJobs: pickNumber(item, 'current_jobs'),
    completionRate: pickNumber(item, 'completion_rate'),
    avatar: toAvatar(name),
  };
}

function mapWorkOrder(item: Dict): WorkOrder {
  const status = statusFromBackend(pickString(item, 'status'));
  const createdAt = pickString(item, 'created_at') || new Date().toISOString();
  const finalPrice = pickFirstNumber(item, ['final_price', 'finalPrice']);
  const basePrice = pickFirstNumber(item, ['base_price', 'estimated_cost', 'estimatedCost']);
  const actualCost = finalPrice > 0 ? finalPrice : undefined;
  const estimatedCost = basePrice > 0 ? basePrice : finalPrice;

  return {
    id: String(item.id ?? ''),
    customerId: String(item.customer_id ?? item.user_id ?? ''),
    customerName: pickString(item, 'customer_name'),
    customerEmail: pickString(item, 'customer_email') || pickString(item, 'email'),
    customerPhone: pickString(item, 'customer_phone') || pickString(item, 'phone_number') || pickString(item, 'phone'),
    serviceType: pickString(item, 'service_name') || pickString(item, 'serviceType'),
    packageName: pickString(item, 'package_name') || pickString(item, 'packageName') || pickString(item, 'package') || undefined,
    priority: (pickString(item, 'priority') as WorkOrder['priority']) || 'medium',
    status,
    technicianId: item.technician_id !== null && item.technician_id !== undefined ? String(item.technician_id) : undefined,
    technicianName: pickString(item, 'technician_name') || undefined,
    scheduledDate: pickString(item, 'scheduled_date'),
    scheduledTime: pickString(item, 'scheduled_time_slot') || '09:00:00',
    location: pickString(item, 'location') || pickString(item, 'address_line'),
    buildingName: pickString(item, 'building_name') || undefined,
    floorNumber: pickString(item, 'floor_number') || undefined,
    apartmentNumber: pickString(item, 'apartment_number') || undefined,
    description: pickString(item, 'customer_notes') || pickString(item, 'notes'),
    customerNotes: pickString(item, 'customer_notes') || undefined,
    preferredTechnician: pickString(item, 'preferred_technician') || undefined,
    parkingInstructions: pickString(item, 'parking_instructions') || undefined,
    petWarning: pickString(item, 'pet_warning') || undefined,
    callBeforeArrival: Boolean(item.call_before_arrival),
    estimatedCost,
    actualCost,
    createdAt,
    completedAt: pickString(item, 'completed_at') || undefined,
  };
}

function mapService(item: Dict, categoriesById: Map<number, string>): Service {
  const categoryId = Number(item.category_id ?? 0);
  const categoryName = categoriesById.get(categoryId) || `Category ${categoryId}`;
  return {
    id: String(item.id ?? ''),
    name: pickString(item, 'name'),
    category: categoryName,
    basePrice: pickNumber(item, 'base_price'),
    duration: pickNumber(item, 'duration_minutes') || 60,
    description: pickString(item, 'description'),
    isActive: item.is_active !== false,
    color: getDefaultCategoryColor(categoryName),
  };
}

function mapServicePackage(item: Dict): ServicePackage {
  return {
    id: String(item.id ?? ''),
    name: pickString(item, 'name'),
    description: pickString(item, 'description'),
    serviceIds: Array.isArray(item.service_ids)
      ? item.service_ids.map((value) => String(value))
      : [],
    estimatedTimes: typeof item.estimated_times === 'object' && item.estimated_times !== null
      ? (item.estimated_times as Record<string, string>)
      : {},
    isActive: item.is_active !== false,
  };
}

function mapPreviousCustomer(item: Dict): PreviousCustomer {
  const name = pickString(item, 'full_name') || pickString(item, 'name') || '';
  return {
    id: String(item.id ?? item.customer_id ?? ''),
    name: name || undefined,
    fullName: name || undefined,
    email: pickString(item, 'email'),
    phone: pickString(item, 'phone') || pickString(item, 'phone_number'),
    lastBookingAt: pickString(item, 'last_booking_at') || pickString(item, 'lastBookingAt') || undefined,
    totalBookings: pickNumber(item, 'total_bookings') || pickNumber(item, 'booking_count') || undefined,
  };
}

function mapBookingTask(item: Dict): BookingTask {
  return {
    id: String(item.id ?? ''),
    title: pickString(item, 'title') || pickString(item, 'name') || 'Task',
    description: pickString(item, 'description') || pickString(item, 'notes') || undefined,
    orderIndex: pickNumber(item, 'order_index') || pickNumber(item, 'orderIndex') || 0,
    completed: Boolean(item.completed || item.is_done || item.done),
  };
}

async function getCategories(): Promise<Array<{ id: number; name: string }>> {
  const data = await request<Dict[] | { categories?: Dict[]; error?: string }>('/services/categories/all');
  const categoryList = Array.isArray(data) ? data : (data.categories || []);
  return categoryList.map((item) => ({
    id: Number(item.id ?? 0),
    name: pickString(item, 'name'),
  }));
}

async function ensureCategoryId(categoryName: string): Promise<number> {
  const categories = await getCategories();
  const existing = categories.find((c) => c.name.toLowerCase() === categoryName.trim().toLowerCase());
  if (existing) {
    return existing.id;
  }

  const created = await request<Dict>('/services/categories', {
    method: 'POST',
    body: JSON.stringify({ name: categoryName.trim(), icon_url: null }),
  }, true);

  return Number(created.id ?? 0);
}

export const mockApi = {
  subscribeRealtime: (onEvent: (event: RealtimeEvent) => void): (() => void) => {
    let stopped = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let pingTimer: number | null = null;

    const clearTimers = () => {
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (pingTimer !== null) {
        window.clearInterval(pingTimer);
        pingTimer = null;
      }
    };

    const connect = () => {
      if (stopped) return;

      try {
        socket = new WebSocket(getRealtimeWsUrl());
      } catch {
        reconnectTimer = window.setTimeout(connect, 3000);
        return;
      }

      socket.onopen = () => {
        pingTimer = window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, 25000);
      };

      socket.onmessage = (message) => {
        try {
          const payload = JSON.parse(message.data) as RealtimeEvent;
          if (payload?.event) {
            onEvent(payload);
          }
        } catch {
          // Ignore malformed payloads.
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        clearTimers();
        if (!stopped) {
          reconnectTimer = window.setTimeout(connect, 2000);
        }
      };
    };

    connect();

    return () => {
      stopped = true;
      clearTimers();
      if (socket && socket.readyState <= WebSocket.OPEN) {
        socket.close();
      }
    };
  },

  getTechnicians: async (): Promise<Technician[]> => {
    const data = await request<{ technicians?: Dict[] }>('/technicians', undefined, true);
    return (data.technicians || []).map(mapTechnician);
  },

  getTechnicianById: async (id: string): Promise<Technician | undefined> => {
    const data = await request<{ technician?: Dict }>(`/technicians/${id}`, undefined, true);
    return data.technician ? mapTechnician(data.technician) : undefined;
  },

  updateTechnicianStatus: async (id: string, nextStatus: Technician['status']): Promise<Technician> => {
    await request<{ profile: Dict }>(`/technicians/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify({ status: nextStatus }),
    }, true);

    const technician = await mockApi.getTechnicianById(id);
    if (!technician) {
      throw new Error('Technician not found after status update');
    }
    return technician;
  },

  updateTechnicianProfile: async (id: string, input: UpdateTechnicianProfileInput): Promise<Technician> => {
    const payload: Record<string, unknown> = {};
    if (typeof input.fullName === 'string') payload.full_name = input.fullName;
    if (typeof input.email === 'string') payload.email = input.email;
    if (typeof input.phone === 'string') payload.phone_number = input.phone;
    if (typeof input.status === 'string') payload.status = input.status;

    const data = await request<{ profile?: Dict }>(`/technicians/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, true);

    if (data.profile) {
      return mapTechnician(data.profile);
    }

    const technician = await mockApi.getTechnicianById(id);
    if (!technician) {
      throw new Error('Technician not found after profile update');
    }
    return technician;
  },

  createTechnician: async (input: CreateTechnicianInput): Promise<Technician> => {
    const data = await request<{ technician?: Dict }>(
      '/technicians',
      {
        method: 'POST',
        body: JSON.stringify({
          full_name: input.fullName,
          email: input.email,
          phone_number: input.phone || '',
          password: input.password,
        }),
      },
      true,
    );

    if (!data.technician) {
      throw new Error('Technician creation did not return a technician payload');
    }

    return mapTechnician(data.technician);
  },

  removeTechnician: async (id: string): Promise<void> => {
    await request(`/technicians/${id}`, { method: 'DELETE' }, true);
  },

  getWorkOrders: async (): Promise<WorkOrder[]> => {
    const data = await request<Dict[] | { bookings?: Dict[] }>('/bookings/', undefined, true);
    const list = Array.isArray(data) ? data : (data.bookings || []);
    return list.map(mapWorkOrder);
  },

  getWorkOrderById: async (id: string): Promise<WorkOrder | undefined> => {
    const data = await request<Dict | { booking?: Dict }>(`/bookings/${id}`, undefined, true);
    const booking = 'booking' in data ? data.booking : data;
    return booking ? mapWorkOrder(booking as Dict) : undefined;
  },

  createWorkOrder: async (data: Partial<WorkOrder>): Promise<WorkOrder> => {
    const services = await mockApi.getServices();
    const packages = await mockApi.getServicePackages();
    const candidate = services.find((item) => item.name.toLowerCase() === (data.serviceType || '').toLowerCase()) || services[0];
    if (!candidate) {
      throw new Error('No services available. Please create a service first.');
    }
    const packageCandidate = packages[0];
    const packageId = Number(packageCandidate?.id || 0);
    if (!packageId) {
      throw new Error('No service packages available. Please configure at least one package.');
    }

    const me = await request<Dict>('/auth/me', undefined, true);
    const customerId = Number(data.customerId || me.id || 0);
    if (!customerId) {
      throw new Error('Unable to determine customer account for booking creation.');
    }

    const payload = {
      customer_id: customerId,
      service_id: Number(candidate.id),
      package_id: packageId,
      scheduled_date: data.scheduledDate || new Date().toISOString().slice(0, 10),
      scheduled_time_slot: toBackendTimeSlot(data.scheduledTime),
      address_line: data.location || 'Not specified',
      building_name: data.buildingName || null,
      floor_number: data.floorNumber || null,
      apartment_number: data.apartmentNumber || null,
      customer_notes: data.customerNotes || data.description || '',
    };

    const created = await request<{ booking?: Dict; booking_id?: number }>('/bookings/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);

    if (created.booking) {
      return mapWorkOrder(created.booking);
    }

    const createdId = Number(created.booking_id || 0);
    if (!createdId) {
      throw new Error('Booking created but backend did not return booking details');
    }

    const fetched = await mockApi.getWorkOrderById(String(createdId));
    if (!fetched) {
      throw new Error('Booking created but could not be retrieved');
    }
    return fetched;
  },

  assignWorkOrder: async (workOrderId: string, technicianId: string): Promise<WorkOrder> => {
    const updated = await request<{ booking: Dict }>(`/bookings/${workOrderId}/assign?technician_id=${encodeURIComponent(String(Number(technicianId)))}`, {
      method: 'PUT',
    }, true);

    const full = await mockApi.getWorkOrderById(String(updated.booking.id ?? workOrderId));
    if (!full) {
      throw new Error('Booking not found after assignment');
    }
    return full;
  },

  updateWorkOrderStatus: async (id: string, nextStatus: WorkOrder['status']): Promise<WorkOrder> => {
    const backendStatus = encodeURIComponent(statusToBackend(nextStatus));
    await request<{ booking: Dict }>(`/bookings/${id}/status?status=${backendStatus}`, {
      method: 'PUT',
    }, true);

    const full = await mockApi.getWorkOrderById(id);
    if (!full) {
      throw new Error('Booking not found after status update');
    }
    return full;
  },

  approveWorkOrderCompletion: async (workOrderId: string): Promise<WorkOrder> => {
    await request(`/bookings/${workOrderId}/completion/approve`, {
      method: 'POST',
    }, true);

    const full = await mockApi.getWorkOrderById(workOrderId);
    if (!full) {
      throw new Error('Booking not found after completion approval');
    }
    return full;
  },

  approveWorkOrderRejection: async (workOrderId: string): Promise<WorkOrder> => {
    await request(`/bookings/${workOrderId}/rejection/approve`, {
      method: 'POST',
    }, true);

    const full = await mockApi.getWorkOrderById(workOrderId);
    if (!full) {
      throw new Error('Booking not found after rejection approval');
    }
    return full;
  },

  getServices: async (): Promise<Service[]> => {
    const [serviceData, categoryData] = await Promise.all([
      request<Dict[] | { services?: Dict[] }>('/services/'),
      request<Dict[] | { categories?: Dict[] }>('/services/categories/all'),
    ]);

    const categories = Array.isArray(categoryData)
      ? categoryData
      : (categoryData.categories || []);

    const categoriesById = new Map<number, string>(
      categories.map((c) => [Number(c.id ?? 0), pickString(c, 'name')]),
    );

    const serviceList = Array.isArray(serviceData)
      ? serviceData
      : (serviceData.services || []);

    return serviceList.map((item) => mapService(item, categoriesById));
  },

  createService: async (data: Partial<Service>): Promise<Service> => {
    const categoryName = (data.category || 'General').trim();
    const categoryId = await ensureCategoryId(categoryName);

    const created = await request<Dict>('/services/', {
      method: 'POST',
      body: JSON.stringify({
        category_id: categoryId,
        name: data.name || '',
        description: data.description || '',
        base_price: Number(data.basePrice || 0),
        duration_minutes: Number(data.duration || 60),
      }),
    }, true);

    const createdId = pickNumber(created, 'service_id');
    if (createdId > 0) {
      const fetched = await request<Dict>(`/services/${createdId}`);
      const mapped = mapService(fetched, new Map<number, string>([[categoryId, categoryName]]));
      return { ...mapped, color: data.color };
    }

    const mapped = mapService(created, new Map<number, string>([[categoryId, categoryName]]));
    return { ...mapped, color: data.color };
  },

  updateService: async (id: string, data: Partial<Service>): Promise<Service> => {
    const currentService = await request<Dict>(`/services/${id}`);

    const categoryName = data.category || `Category ${Number(currentService.category_id ?? 0)}`;
    const categoryId = await ensureCategoryId(categoryName);

    const updated = await request<Dict>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        category_id: categoryId,
        name: data.name ?? pickString(currentService, 'name'),
        description: data.description ?? pickString(currentService, 'description'),
        base_price: data.basePrice ?? pickNumber(currentService, 'base_price'),
        duration_minutes: data.duration ?? (pickNumber(currentService, 'duration_minutes') || 60),
      }),
    }, true);

    if (data.isActive === false) {
      await request(`/services/${id}`, { method: 'DELETE' }, true);
    }

    const mapped = mapService(updated, new Map<number, string>([[categoryId, categoryName]]));
    return { ...mapped, isActive: data.isActive ?? mapped.isActive, color: data.color };
  },

  getServicePackages: async (): Promise<ServicePackage[]> => {
    const data = await request<Dict[]>('/service-packages/', undefined, true);
    return Array.isArray(data) ? data.map(mapServicePackage) : [];
  },

  createServicePackage: async (data: Partial<ServicePackage>): Promise<ServicePackage> => {
    const created = await request<Dict>('/service-packages/', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name || '',
        description: data.description || '',
        service_ids: (data.serviceIds || []).map((value) => Number(value)),
        estimated_times: data.estimatedTimes || {},
      }),
    }, true);

    return mapServicePackage(created);
  },

  updateServicePackage: async (id: string, data: Partial<ServicePackage>): Promise<ServicePackage> => {
    const updated = await request<Dict>(`/service-packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        service_ids: data.serviceIds ? data.serviceIds.map((value) => Number(value)) : undefined,
        estimated_times: data.estimatedTimes,
        is_active: data.isActive,
      }),
    }, true);

    return mapServicePackage(updated);
  },

  deleteServicePackage: async (id: string): Promise<void> => {
    await request(`/service-packages/${id}`, { method: 'DELETE' }, true);
  },

  getRevenueStats: async (period: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<RevenueStats> => {
    const data = await request<{ stats?: Dict }>(`/payments/stats/revenue?period=${encodeURIComponent(period)}`, undefined, true);
    const stats = (data.stats || data) as Dict;

    const dailyRevenueRaw = Array.isArray(stats.daily_revenue) ? stats.daily_revenue : [];
    const dailyRevenue = dailyRevenueRaw.map((entry) => {
      const item = entry as Dict;
      return {
        date: pickString(item, 'date'),
        revenue: pickNumber(item, 'revenue'),
      };
    });

    const trendRaw = Array.isArray(stats.trend_data) ? stats.trend_data : dailyRevenueRaw;
    const trendData = trendRaw.map((entry) => {
      const item = entry as Dict;
      return {
        label: pickString(item, 'label') || pickString(item, 'date'),
        revenue: pickNumber(item, 'revenue'),
      };
    });

    return {
      totalRevenue: pickFirstNumber(stats, ['total_revenue', 'totalRevenue']),
      pendingRevenue: pickFirstNumber(stats, ['pending_revenue', 'pendingRevenue']),
      dailyRevenue,
      trendData,
      trendPeriod: (pickString(stats, 'trend_period') as RevenueStats['trendPeriod']) || period,
    };
  },

  getPreviousCustomers: async (): Promise<PreviousCustomer[]> => {
    const data = await request<Dict[] | { customers?: Dict[] }>('/customers/previous', undefined, true);
    const list = Array.isArray(data) ? data : (data.customers || []);
    return list.map(mapPreviousCustomer);
  },

  getBookingTasks: async (bookingId: string): Promise<BookingTask[]> => {
    const data = await request<Dict[] | { tasks?: Dict[] }>(`/bookings/${encodeURIComponent(String(bookingId))}/tasks`, undefined, true);
    const list = Array.isArray(data) ? data : (data.tasks || []);
    return list.map(mapBookingTask);
  },

  getNotifications: async (): Promise<NotificationItem[]> => {
    const data = await request<Dict[] | { notifications?: Dict[] }>('/notifications/', undefined, true);
    const list = Array.isArray(data) ? data : (data.notifications || []);
    return list.map((item) => ({
      id: Number(item.id ?? 0),
      message: pickString(item, 'message'),
      type: pickString(item, 'type') || pickString(item, 'notification_type') || 'info',
      isRead: Boolean(item.is_read),
      createdAt: pickString(item, 'created_at'),
      readAt: pickString(item, 'read_at') || undefined,
    }));
  },

  getUnreadNotificationCount: async (): Promise<number> => {
    const data = await request<{ unread_count?: number }>('/notifications/unread', undefined, true);
    return Number(data.unread_count ?? 0);
  },

  markNotificationAsRead: async (id: number): Promise<void> => {
    await request(`/notifications/${id}/read`, { method: 'PUT' }, true);
  },

  markAllNotificationsAsRead: async (): Promise<void> => {
    await request('/notifications/read-all', { method: 'PUT' }, true);
  },

  getKPIs: async (): Promise<KPIData> => {
    const [statsData, technicians] = await Promise.all([
      request<{ stats?: Dict }>('/bookings/stats/dashboard', undefined, true),
      mockApi.getTechnicians(),
    ]);

    const stats = (statsData.stats || statsData) as Dict;
    return {
      activeWorkOrders: pickFirstNumber(stats, ['active_orders', 'active_bookings', 'activeWorkOrders']),
      totalRevenue: pickFirstNumber(stats, ['total_revenue', 'revenue', 'totalRevenue']),
      avgCompletionRate: pickFirstNumber(stats, ['completion_rate', 'avg_completion_rate', 'avgCompletionRate']),
      totalTechnicians: technicians.length,
      completedToday: pickFirstNumber(stats, ['completed_today', 'completed_bookings_today', 'completedToday']),
    };
  },

  logoutSession: async (): Promise<void> => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch {
      // Ignore logout transport errors; local state still gets cleared.
    } finally {
      clearStoredAuth();
    }
  },
};
