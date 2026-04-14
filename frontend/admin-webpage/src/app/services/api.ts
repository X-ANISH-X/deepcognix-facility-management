/**
 * Real API Service — connects to the FastAPI backend.
 * Mirrors the shape of mockApi so components can swap in seamlessly.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ─── Token helpers ───────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

export function setToken(token: string): void {
  localStorage.setItem('admin_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

export function getStoredUser(): AdminUser | null {
  const raw = localStorage.getItem('admin_user');
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user: AdminUser): void {
  localStorage.setItem('admin_user', JSON.stringify(user));
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

const get = <T>(path: string) => request<T>(path, { method: 'GET' });
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });
const put = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
const patch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) });

// ─── Types (aligned with mockApi interfaces) ─────────────────────────────────

export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string[];
  status: 'available' | 'on-job' | 'offline';
  location: { lat: number; lng: number; address: string };
  currentJobs: number;
  completionRate: number;
  avatar: string;
  rawId: number;
}

export interface WorkOrder {
  id: string;
  customerId: string;
  customerName: string;
  serviceType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  rawStatus: string;
  technicianId?: string;
  technicianName?: string;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  description: string;
  estimatedCost: number;
  actualCost?: number;
  createdAt: string;
  completedAt?: string;
  rawId: number;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  categoryId: number;
  basePrice: number;
  duration: number;
  description: string;
  isActive: boolean;
  rawId: number;
}

export interface Category {
  id: number;
  name: string;
  icon_url: string | null;
  is_active: boolean;
}

export interface KPIData {
  activeWorkOrders: number;
  totalRevenue: number;
  avgCompletionRate: number;
  maintenanceCostPerGSF: number;
  totalTechnicians: number;
  completedToday: number;
}

// ─── Raw backend shapes ───────────────────────────────────────────────────────

interface RawBooking {
  id: number;
  customer_id: number;
  customer_name: string;
  service_name: string;
  technician_id: number | null;
  technician_name: string | null;
  status: string;
  final_price: number | null;
  scheduled_date: string;
  scheduled_time_slot: string;
  address_line: string;
  building_name: string | null;
  floor_number: string | null;
  apartment_number: string | null;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface RawUser {
  id: number;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: string;
  is_active: boolean;
}

interface RawService {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  base_price: number;
  duration_minutes: number;
  is_active: boolean;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapBookingStatus(s: string): WorkOrder['status'] {
  switch (s) {
    case 'submitted': return 'pending';
    case 'approved': return 'pending';
    case 'assigned': return 'assigned';
    case 'in_progress': return 'in-progress';
    case 'completed': return 'completed';
    case 'cancelled':
    case 'rejected': return 'cancelled';
    default: return 'pending';
  }
}

function mapBookingPriority(_b: RawBooking): WorkOrder['priority'] {
  return 'medium';
}

function mapBooking(b: RawBooking): WorkOrder {
  const timeLabel =
    b.scheduled_time_slot === 'morning'
      ? '09:00'
      : b.scheduled_time_slot === 'afternoon'
      ? '14:00'
      : '18:00';

  const locationParts = [
    b.address_line,
    b.building_name,
    b.floor_number ? `Floor ${b.floor_number}` : null,
    b.apartment_number ? `Apt ${b.apartment_number}` : null,
  ].filter(Boolean);

  return {
    id: `BK-${b.id}`,
    customerId: String(b.customer_id),
    customerName: b.customer_name,
    serviceType: b.service_name,
    priority: mapBookingPriority(b),
    status: mapBookingStatus(b.status),
    technicianId: b.technician_id ? String(b.technician_id) : undefined,
    technicianName: b.technician_name ?? undefined,
    scheduledDate: b.scheduled_date,
    scheduledTime: timeLabel,
    location: locationParts.join(', '),
    description: b.customer_notes ?? '',
    estimatedCost: b.final_price ?? 0,
    actualCost: b.status === 'completed' ? (b.final_price ?? 0) : undefined,
    createdAt: b.created_at,
    completedAt: b.status === 'completed' ? b.updated_at : undefined,
    rawId: b.id,
    rawStatus: b.status,
  };
}

function mapTechnician(u: RawUser, activeJobCount: number): Technician {
  return {
    id: `tech-${u.id}`,
    name: u.full_name,
    email: u.email,
    phone: u.phone_number ?? '',
    specialty: ['General'],
    status: activeJobCount > 0 ? 'on-job' : u.is_active ? 'available' : 'offline',
    location: { lat: 12.9716, lng: 77.5946, address: 'Bengaluru, KA' },
    currentJobs: activeJobCount,
    completionRate: 95,
    avatar: u.full_name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2),
    rawId: u.id,
  };
}

function mapService(s: RawService, categoryName: string): Service {
  return {
    id: `srv-${s.id}`,
    name: s.name,
    category: categoryName,
    categoryId: s.category_id,
    basePrice: s.base_price,
    duration: s.duration_minutes,
    description: s.description ?? '',
    isActive: s.is_active,
    rawId: s.id,
  };
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<AdminUser> => {
    const data = await post<{
      access_token: string;
      token_type: string;
      user_id: number;
      role: string;
      full_name: string;
    }>('/auth/login', { email, password });

    if (data.role !== 'admin') {
      throw new Error('Access denied: admin accounts only');
    }

    setToken(data.access_token);
    const user: AdminUser = {
      id: data.user_id,
      full_name: data.full_name,
      email,
      role: data.role,
    };
    setStoredUser(user);
    return user;
  },

  logout: () => {
    clearToken();
  },

  // Technicians
  getTechnicians: async (): Promise<Technician[]> => {
    const [users, bookings] = await Promise.all([
      get<RawUser[]>('/auth/users?role=technician'),
      get<RawBooking[]>('/bookings'),
    ]);

    const activeJobMap: Record<number, number> = {};
    bookings.forEach((b) => {
      if (
        b.technician_id &&
        ['assigned', 'in_progress'].includes(b.status)
      ) {
        activeJobMap[b.technician_id] = (activeJobMap[b.technician_id] ?? 0) + 1;
      }
    });

    return users.map((u) => mapTechnician(u, activeJobMap[u.id] ?? 0));
  },

  getTechnicianById: async (id: string): Promise<Technician | undefined> => {
    const techs = await api.getTechnicians();
    return techs.find((t) => t.id === id);
  },

  updateTechnicianStatus: async (id: string, _status: Technician['status']): Promise<Technician> => {
    // Status is derived from active jobs; toggle active instead
    const techs = await api.getTechnicians();
    const tech = techs.find((t) => t.id === id);
    if (!tech) throw new Error('Technician not found');
    await patch(`/auth/users/${tech.rawId}/toggle-active`);
    return { ...tech };
  },

  // Work Orders (Bookings)
  getWorkOrders: async (): Promise<WorkOrder[]> => {
    const bookings = await get<RawBooking[]>('/bookings');
    return bookings.map(mapBooking);
  },

  getWorkOrderById: async (id: string): Promise<WorkOrder | undefined> => {
    const orders = await api.getWorkOrders();
    return orders.find((o) => o.id === id);
  },

  approveWorkOrder: async (rawId: number): Promise<void> => {
    await post(`/bookings/${rawId}/approve`);
  },

  cancelWorkOrder: async (rawId: number): Promise<void> => {
    await post(`/bookings/${rawId}/cancel`);
  },

  assignWorkOrder: async (workOrderId: string, technicianId: string): Promise<WorkOrder> => {
    const orders = await api.getWorkOrders();
    const order = orders.find((o) => o.id === workOrderId);
    if (!order) throw new Error('Work order not found');

    const techs = await api.getTechnicians();
    const tech = techs.find((t) => t.id === technicianId);
    if (!tech) throw new Error('Technician not found');

    await post(`/bookings/${order.rawId}/assign`, { technician_id: tech.rawId });
    return { ...order, technicianId, technicianName: tech.name, status: 'assigned' };
  },

  updateWorkOrderStatus: async (id: string, _status: WorkOrder['status']): Promise<WorkOrder> => {
    const orders = await api.getWorkOrders();
    const order = orders.find((o) => o.id === id);
    if (!order) throw new Error('Work order not found');
    return order;
  },

  // Services & Categories
  getCategories: async (): Promise<Category[]> => {
    return get<Category[]>('/categories');
  },

  getServices: async (): Promise<Service[]> => {
    const [services, categories] = await Promise.all([
      get<RawService[]>('/services'),
      get<Category[]>('/categories'),
    ]);
    const catMap: Record<number, string> = {};
    categories.forEach((c) => { catMap[c.id] = c.name; });
    return services.map((s) => mapService(s, catMap[s.category_id] ?? 'Other'));
  },

  createService: async (data: {
    name: string;
    category: string;
    categoryId: number;
    basePrice: number;
    duration: number;
    description: string;
  }): Promise<Service> => {
    const created = await post<{ service_id: number }>('/services', {
      category_id: data.categoryId,
      name: data.name,
      description: data.description,
      base_price: data.basePrice,
      duration_minutes: data.duration,
    });
    return {
      id: `srv-${created.service_id}`,
      name: data.name,
      category: data.category,
      categoryId: data.categoryId,
      basePrice: data.basePrice,
      duration: data.duration,
      description: data.description,
      isActive: true,
      rawId: created.service_id,
    };
  },

  updateService: async (rawId: number, data: {
    name: string;
    categoryId: number;
    category: string;
    basePrice: number;
    duration: number;
    description: string;
  }): Promise<Service> => {
    const updated = await put<RawService>(`/services/${rawId}`, {
      category_id: data.categoryId,
      name: data.name,
      description: data.description,
      base_price: data.basePrice,
      duration_minutes: data.duration,
    });
    return mapService(updated, data.category);
  },

  toggleServiceActive: async (rawId: number): Promise<{ is_active: boolean }> => {
    return patch<{ service_id: number; is_active: boolean }>(`/services/${rawId}/toggle-active`);
  },

  // Technician management
  createTechnician: async (data: {
    full_name: string;
    email: string;
    password: string;
    phone_number: string;
  }): Promise<{ user_id: number; message: string }> => {
    return post<{ user_id: number; message: string }>('/auth/admin/create-user', {
      full_name: data.full_name,
      email: data.email,
      password: data.password,
      phone_number: data.phone_number || null,
      role: 'technician',
    });
  },

  // KPIs
  getKPIs: async (): Promise<KPIData> => {
    const [orders, techs] = await Promise.all([
      api.getWorkOrders(),
      api.getTechnicians(),
    ]);

    const activeOrders = orders.filter(
      (o) => o.status === 'assigned' || o.status === 'in-progress',
    ).length;

    const completedOrders = orders.filter((o) => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((s, o) => s + (o.actualCost ?? 0), 0);

    const today = new Date().toISOString().slice(0, 10);
    const completedToday = completedOrders.filter(
      (o) => o.completedAt?.startsWith(today),
    ).length;

    return {
      activeWorkOrders: activeOrders,
      totalRevenue,
      avgCompletionRate: 95,
      maintenanceCostPerGSF: 2.34,
      totalTechnicians: techs.length,
      completedToday,
    };
  },
};
