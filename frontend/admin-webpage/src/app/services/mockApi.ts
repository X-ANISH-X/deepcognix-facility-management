// Mock API Service - Replace with actual backend calls
// This structure makes it easy to swap in real API endpoints later

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string[];
  status: 'available' | 'on-job' | 'offline';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  currentJobs: number;
  completionRate: number;
  avatar: string;
}

export interface WorkOrder {
  id: string;
  customerId: string;
  customerName: string;
  serviceType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
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
}

export interface Service {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  duration: number; // in minutes
  description: string;
  isActive: boolean;
}

export interface KPIData {
  activeWorkOrders: number;
  totalRevenue: number;
  avgCompletionRate: number;
  maintenanceCostPerGSF: number;
  totalTechnicians: number;
  completedToday: number;
}

// Mock Data
const mockTechnicians: Technician[] = [
  {
    id: 'tech-001',
    name: 'John Mitchell',
    email: 'john.mitchell@facility.com',
    phone: '+1-555-0101',
    specialty: ['Plumbing', 'HVAC'],
    status: 'on-job',
    location: { lat: 40.7128, lng: -74.0060, address: '123 Main St, New York' },
    currentJobs: 2,
    completionRate: 94.5,
    avatar: 'JM'
  },
  {
    id: 'tech-002',
    name: 'Sarah Chen',
    email: 'sarah.chen@facility.com',
    phone: '+1-555-0102',
    specialty: ['Electrical', 'Lighting'],
    status: 'available',
    location: { lat: 40.7489, lng: -73.9680, address: '456 Park Ave, New York' },
    currentJobs: 0,
    completionRate: 98.2,
    avatar: 'SC'
  },
  {
    id: 'tech-003',
    name: 'Michael Torres',
    email: 'michael.torres@facility.com',
    phone: '+1-555-0103',
    specialty: ['HVAC', 'Cleaning'],
    status: 'on-job',
    location: { lat: 40.7589, lng: -73.9851, address: '789 Broadway, New York' },
    currentJobs: 1,
    completionRate: 91.8,
    avatar: 'MT'
  },
  {
    id: 'tech-004',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@facility.com',
    phone: '+1-555-0104',
    specialty: ['Plumbing', 'General Maintenance'],
    status: 'available',
    location: { lat: 40.7306, lng: -73.9352, address: '321 Queens Blvd, New York' },
    currentJobs: 0,
    completionRate: 96.7,
    avatar: 'ER'
  },
  {
    id: 'tech-005',
    name: 'David Kim',
    email: 'david.kim@facility.com',
    phone: '+1-555-0105',
    specialty: ['Electrical', 'Security'],
    status: 'offline',
    location: { lat: 40.6782, lng: -73.9442, address: '567 Atlantic Ave, Brooklyn' },
    currentJobs: 0,
    completionRate: 89.3,
    avatar: 'DK'
  }
];

const mockWorkOrders: WorkOrder[] = [
  {
    id: 'WO-2026-001',
    customerId: 'cust-001',
    customerName: 'Acme Corporation',
    serviceType: 'HVAC Repair',
    priority: 'urgent',
    status: 'assigned',
    technicianId: 'tech-001',
    technicianName: 'John Mitchell',
    scheduledDate: '2026-01-15',
    scheduledTime: '10:00',
    location: '100 Business Park, Suite 200',
    description: 'AC unit not cooling properly, urgent repair needed',
    estimatedCost: 450,
    createdAt: '2026-01-15T08:30:00Z'
  },
  {
    id: 'WO-2026-002',
    customerId: 'cust-002',
    customerName: 'TechStart Inc',
    serviceType: 'Plumbing',
    priority: 'high',
    status: 'in-progress',
    technicianId: 'tech-001',
    technicianName: 'John Mitchell',
    scheduledDate: '2026-01-15',
    scheduledTime: '14:00',
    location: '250 Innovation Drive',
    description: 'Leaking pipe in server room',
    estimatedCost: 280,
    createdAt: '2026-01-14T16:45:00Z'
  },
  {
    id: 'WO-2026-003',
    customerId: 'cust-003',
    customerName: 'Global Retail Chain',
    serviceType: 'Electrical',
    priority: 'medium',
    status: 'pending',
    scheduledDate: '2026-01-16',
    scheduledTime: '09:00',
    location: '789 Shopping Plaza',
    description: 'Install new LED lighting in store',
    estimatedCost: 1200,
    createdAt: '2026-01-14T10:20:00Z'
  },
  {
    id: 'WO-2026-004',
    customerId: 'cust-004',
    customerName: 'Downtown Offices LLC',
    serviceType: 'Cleaning',
    priority: 'low',
    status: 'completed',
    technicianId: 'tech-003',
    technicianName: 'Michael Torres',
    scheduledDate: '2026-01-14',
    scheduledTime: '18:00',
    location: '456 Office Tower, Floor 12',
    description: 'Deep cleaning after renovation',
    estimatedCost: 800,
    actualCost: 800,
    createdAt: '2026-01-13T09:00:00Z',
    completedAt: '2026-01-14T22:30:00Z'
  },
  {
    id: 'WO-2026-005',
    customerId: 'cust-005',
    customerName: 'Metro Hospital',
    serviceType: 'HVAC Maintenance',
    priority: 'high',
    status: 'assigned',
    technicianId: 'tech-003',
    technicianName: 'Michael Torres',
    scheduledDate: '2026-01-15',
    scheduledTime: '15:30',
    location: '1000 Healthcare Ave, Building C',
    description: 'Routine HVAC system inspection and filter replacement',
    estimatedCost: 350,
    createdAt: '2026-01-15T07:00:00Z'
  }
];

const mockServices: Service[] = [
  {
    id: 'srv-001',
    name: 'AC Repair',
    category: 'HVAC',
    basePrice: 450,
    duration: 120,
    description: 'Air conditioning unit repair and diagnostics',
    isActive: true
  },
  {
    id: 'srv-002',
    name: 'Plumbing Emergency',
    category: 'Plumbing',
    basePrice: 280,
    duration: 90,
    description: 'Emergency plumbing repairs including leaks and blockages',
    isActive: true
  },
  {
    id: 'srv-003',
    name: 'Electrical Installation',
    category: 'Electrical',
    basePrice: 1200,
    duration: 240,
    description: 'New electrical installations and upgrades',
    isActive: true
  },
  {
    id: 'srv-004',
    name: 'Deep Cleaning',
    category: 'Cleaning',
    basePrice: 800,
    duration: 300,
    description: 'Professional deep cleaning services',
    isActive: true
  },
  {
    id: 'srv-005',
    name: 'HVAC Maintenance',
    category: 'HVAC',
    basePrice: 350,
    duration: 90,
    description: 'Regular HVAC system maintenance and inspection',
    isActive: true
  },
  {
    id: 'srv-006',
    name: 'Lock Repair',
    category: 'Security',
    basePrice: 180,
    duration: 60,
    description: 'Lock repair and replacement services',
    isActive: true
  }
];

// Mock API Functions
export const mockApi = {
  // Technicians
  getTechnicians: async (): Promise<Technician[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockTechnicians;
  },

  getTechnicianById: async (id: string): Promise<Technician | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockTechnicians.find(t => t.id === id);
  },

  updateTechnicianStatus: async (id: string, status: Technician['status']): Promise<Technician> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const tech = mockTechnicians.find(t => t.id === id);
    if (tech) {
      tech.status = status;
    }
    return tech!;
  },

  // Work Orders
  getWorkOrders: async (): Promise<WorkOrder[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockWorkOrders;
  },

  getWorkOrderById: async (id: string): Promise<WorkOrder | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockWorkOrders.find(wo => wo.id === id);
  },

  createWorkOrder: async (data: Partial<WorkOrder>): Promise<WorkOrder> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newOrder: WorkOrder = {
      id: `WO-2026-${String(mockWorkOrders.length + 1).padStart(3, '0')}`,
      customerId: data.customerId || '',
      customerName: data.customerName || '',
      serviceType: data.serviceType || '',
      priority: data.priority || 'medium',
      status: 'pending',
      scheduledDate: data.scheduledDate || '',
      scheduledTime: data.scheduledTime || '',
      location: data.location || '',
      description: data.description || '',
      estimatedCost: data.estimatedCost || 0,
      createdAt: new Date().toISOString()
    };
    mockWorkOrders.push(newOrder);
    return newOrder;
  },

  assignWorkOrder: async (workOrderId: string, technicianId: string): Promise<WorkOrder> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const order = mockWorkOrders.find(wo => wo.id === workOrderId);
    const tech = mockTechnicians.find(t => t.id === technicianId);
    if (order && tech) {
      order.technicianId = technicianId;
      order.technicianName = tech.name;
      order.status = 'assigned';
      tech.currentJobs += 1;
    }
    return order!;
  },

  updateWorkOrderStatus: async (id: string, status: WorkOrder['status']): Promise<WorkOrder> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const order = mockWorkOrders.find(wo => wo.id === id);
    if (order) {
      order.status = status;
      if (status === 'completed') {
        order.completedAt = new Date().toISOString();
        order.actualCost = order.estimatedCost;
      }
    }
    return order!;
  },

  // Services
  getServices: async (): Promise<Service[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockServices;
  },

  createService: async (data: Partial<Service>): Promise<Service> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newService: Service = {
      id: `srv-${String(mockServices.length + 1).padStart(3, '0')}`,
      name: data.name || '',
      category: data.category || '',
      basePrice: data.basePrice || 0,
      duration: data.duration || 60,
      description: data.description || '',
      isActive: true
    };
    mockServices.push(newService);
    return newService;
  },

  updateService: async (id: string, data: Partial<Service>): Promise<Service> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const service = mockServices.find(s => s.id === id);
    if (service) {
      Object.assign(service, data);
    }
    return service!;
  },

  // KPIs
  getKPIs: async (): Promise<KPIData> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const activeOrders = mockWorkOrders.filter(wo => 
      wo.status === 'assigned' || wo.status === 'in-progress'
    ).length;
    
    const completedOrders = mockWorkOrders.filter(wo => wo.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, wo) => sum + (wo.actualCost || 0), 0);
    
    const avgCompletionRate = mockTechnicians.reduce((sum, t) => sum + t.completionRate, 0) / mockTechnicians.length;
    
    const completedToday = mockWorkOrders.filter(wo => 
      wo.status === 'completed' && wo.completedAt?.startsWith('2026-01-15')
    ).length;

    return {
      activeWorkOrders: activeOrders,
      totalRevenue,
      avgCompletionRate,
      maintenanceCostPerGSF: 2.34, // Mock value
      totalTechnicians: mockTechnicians.length,
      completedToday
    };
  }
};
