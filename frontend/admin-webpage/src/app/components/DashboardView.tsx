import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { api as mockApi, type KPIData, type Service, type WorkOrder } from '@/app/services/api';
import { useLanguage } from '@/app/context/LanguageContext';
import { Activity, DollarSign, Users, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Sector } from 'recharts';
import { toast } from 'sonner';

// Color mapping for categories - must match serviceColors configuration
const categoryColorMap: Record<string, string> = {
  'general cleaning': '#0f766e',
  'kitchen cleaning': '#d97706',
  'bathroom care': '#0284c7',
  'windows & balcony': '#4f46e5',
  'upholstery & fabrics': '#be185d',
  'sanitization': '#059669',
  'premium detailing': '#475569',
  'add-on services': '#ea580c',
  'hvac': '#2563eb',
  'plumbing': '#16a34a',
  'electrical': '#ca8a04',
  'cleaning': '#7c3aed',
  'security': '#dc2626',
  'lighting': '#f59e0b',
};

const fallbackPalette = [
  '#06b6d4', // cyan-600
  '#84cc16', // lime-600
  '#d946ef', // fuchsia-600
  '#78716c', // stone-600
];

const getCategoryColor = (categoryName: string): string => {
  const normalized = categoryName.trim().toLowerCase();
  return categoryColorMap[normalized] || fallbackPalette[
    normalized.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % fallbackPalette.length
  ];
};

interface DistributionSlice {
  name: string;
  value: number;
  color: string;
  percentage: number;
  type: 'category' | 'service';
  category: string;
  parentCategory?: string;
}

const POP_ANIMATION_SCALE = 1;
const ACTIVE_SLICE_OFFSET = 10;
const RADIAN = Math.PI / 180;

const buildEmptyRevenueTrend = (period: 'day' | 'week' | 'month' | 'year') => {
  if (period === 'day') {
    return Array.from({ length: 10 }, (_, index) => {
      const hour = 8 + index;
      return { label: `${hour.toString().padStart(2, '0')}:00`, revenue: 0 };
    });
  }

  if (period === 'week') {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 6);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return { label: date.toLocaleDateString('en-US', { weekday: 'short' }), revenue: 0 };
    });
  }

  if (period === 'month') {
    return Array.from({ length: 5 }, (_, index) => ({ label: `Week ${index + 1}`, revenue: 0 }));
  }

  return [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ].map((label) => ({ label, revenue: 0 }));
};

const adjustColorLightness = (hex: string, percent: number): string => {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) {
    return hex;
  }

  const num = parseInt(raw, 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, (num >> 8 & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));

  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

const renderActiveSlice = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, midAngle } = props;
  const offsetDistance = ACTIVE_SLICE_OFFSET * POP_ANIMATION_SCALE;
  const shiftedCx = cx + offsetDistance * Math.cos(-midAngle * RADIAN);
  const shiftedCy = cy + offsetDistance * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      <Sector
        cx={shiftedCx}
        cy={shiftedCy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

interface DashboardViewProps {
  role?: 'admin' | 'technician' | 'customer';
}

export function DashboardView({ role = 'customer' }: DashboardViewProps) {
  const { t } = useLanguage();
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [allOrders, setAllOrders] = useState<WorkOrder[]>([]);
  const [recentOrders, setRecentOrders] = useState<WorkOrder[]>([]);
  const [revenuePeriod, setRevenuePeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [revenueTrend, setRevenueTrend] = useState<Array<{ label: string; revenue: number }>>([]);
  const [serviceDistribution, setServiceDistribution] = useState<DistributionSlice[]>([]);
  const [servicesByCategory, setServicesByCategory] = useState<Record<string, Service[]>>({});
  const [activeSliceIndex, setActiveSliceIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const buildServiceDistribution = (services: Service[]) => {
    const servicesByCategory: Record<string, Service[]> = {};

    services
      .filter((service) => service.isActive)
      .forEach((service) => {
        const categoryKey = service.category;

        if (!servicesByCategory[categoryKey]) {
          servicesByCategory[categoryKey] = [];
        }

        servicesByCategory[categoryKey].push(service);
      });

    const activeServiceCount = services.filter((service) => service.isActive).length || 1;

    return Object.entries(servicesByCategory)
      .map(([category, servicesInCategory]) => {
        const count = servicesInCategory.length;
        // Use deterministic color lookup based on category name instead of service color field
        const baseColor = getCategoryColor(category);

        return {
          name: category,
          value: count,
          color: baseColor,
          percentage: Math.round((count / activeServiceCount) * 100),
          type: 'category' as const,
          category,
        };
      })
      .sort((a, b) => b.value - a.value);
  };

  const groupServicesByCategory = (services: Service[]) => {
    return services
      .filter((service) => service.isActive)
      .reduce((grouped, service) => {
        if (!grouped[service.category]) {
          grouped[service.category] = [];
        }

        grouped[service.category].push(service);
        return grouped;
      }, {} as Record<string, Service[]>);
  };

  const categoryTotals = serviceDistribution.reduce((sum, item) => sum + item.value, 0);

  const pieData = useMemo(() => {
    if (!selectedCategory) {
      return serviceDistribution;
    }

    const selectedCategoryServices = servicesByCategory[selectedCategory] || [];
    const parentCategorySlice = serviceDistribution.find((slice) => slice.category === selectedCategory);

    if (!selectedCategoryServices.length || !parentCategorySlice) {
      return serviceDistribution;
    }

    const categoryColor = parentCategorySlice.color;

    const serviceSlices: DistributionSlice[] = selectedCategoryServices.map((service, index) => {
      const totalServices = selectedCategoryServices.length;
      const offset = (index - (totalServices - 1) / 2) * 12;
      return {
        name: service.name,
        value: 1,
        color: adjustColorLightness(categoryColor, offset),
        percentage: Math.round((1 / parentCategorySlice.value) * 100),
        type: 'service',
        category: service.category,
        parentCategory: selectedCategory,
      };
    });

    return serviceDistribution.flatMap((slice) => {
      if (slice.category !== selectedCategory) {
        return [slice];
      }

      return serviceSlices;
    });
  }, [selectedCategory, serviceDistribution, servicesByCategory]);

  const pieTotal = pieData.reduce((sum, item) => sum + item.value, 0);

  const legendData = useMemo(() => {
    if (!selectedCategory) {
      return pieData;
    }

    const selectedItems = pieData.filter((slice) => slice.parentCategory === selectedCategory);
    const otherItems = pieData.filter((slice) => slice.parentCategory !== selectedCategory);
    return [...selectedItems, ...otherItems];
  }, [pieData, selectedCategory]);

  const drilledSliceIndexes = useMemo(
    () => pieData
      .map((slice, index) => (slice.parentCategory === selectedCategory ? index : -1))
      .filter((index) => index !== -1),
    [pieData, selectedCategory],
  );

  const getSliceOpacity = (index: number) => {
    if (activeSliceIndex === null) {
      return 1;
    }

    return activeSliceIndex === index ? 1 : 0.72;
  };

  const getLegendPercentage = (itemValue: number) => {
    if (!categoryTotals) {
      return 0;
    }

    return Math.round((itemValue / categoryTotals) * 100);
  };

  const getPiePercentage = (itemValue: number) => {
    if (!pieTotal) {
      return 0;
    }

    return Math.round((itemValue / pieTotal) * 100);
  };

  const loadDashboardData = async (silent = true) => {
    try {
      const [kpiData, orders, services] = await Promise.all([
        mockApi.getKPIs(),
        mockApi.getWorkOrders(),
        mockApi.getServices()
      ]);

      setKpis(kpiData);
      setAllOrders(orders);
      setRecentOrders(orders.slice(0, 5));
      setServiceDistribution(buildServiceDistribution(services));
      setServicesByCategory(groupServicesByCategory(services));
    } catch (error) {
      if (!silent) {
        const message = error instanceof Error ? error.message : 'Unable to load dashboard data';
        toast.error(message);
      }
      setKpis({
        activeWorkOrders: 0,
        totalRevenue: 0,
        avgCompletionRate: 0,
        totalTechnicians: 0,
        completedToday: 0,
      });
      setAllOrders([]);
      setRecentOrders([]);
      setServiceDistribution([]);
      setServicesByCategory({});
    }
  };

  const loadRevenueTrend = async (silent = true) => {
    try {
      const revenueStats = await mockApi.getRevenueStats(revenuePeriod);
      const trend = revenueStats.trendData.length > 0 ? revenueStats.trendData : buildEmptyRevenueTrend(revenuePeriod);
      setRevenueTrend(trend);
    } catch (error) {
      if (!silent) {
        const message = error instanceof Error ? error.message : 'Unable to load revenue data';
        toast.error(message);
      }
      setRevenueTrend(buildEmptyRevenueTrend(revenuePeriod));
    }
  };

  useEffect(() => {
    void loadDashboardData(false);

    const unsubscribe = mockApi.subscribeRealtime((event) => {
      const eventName = event.event;
      if (
        eventName.startsWith('booking.') ||
        eventName.startsWith('technician.') ||
        eventName.startsWith('checklist.')
      ) {
        void loadDashboardData(true);
        void loadRevenueTrend(true);
      }
    });

    const pollTimer = window.setInterval(() => {
      void loadDashboardData(true);
      void loadRevenueTrend(true);
    }, 10000);

    return () => {
      unsubscribe();
      window.clearInterval(pollTimer);
    };
  }, []);

  useEffect(() => {
    void loadRevenueTrend(false);
  }, [revenuePeriod]);

  useEffect(() => {
    if (selectedCategory && !servicesByCategory[selectedCategory]) {
      setSelectedCategory(null);
    }
  }, [selectedCategory, servicesByCategory]);

  useEffect(() => {
    setActiveSliceIndex(null);
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 280 * POP_ANIMATION_SCALE + 50);
    return () => clearTimeout(timer);
  }, [selectedCategory]);

  const handleSliceSelection = (category: string) => {
    if (isAnimating) return;
    setSelectedCategory((currentCategory) => currentCategory === category ? null : category);
    setActiveSliceIndex(null);
  };

  const resetToCategories = () => {
    setSelectedCategory(null);
    setActiveSliceIndex(null);
  };

  const pendingSubmittedOrders = useMemo(
    () => allOrders.filter((order) => order.status === 'submitted').slice(0, 6),
    [allOrders],
  );

  const weeklyCompletionData = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 6);

    const completedCounts = new Map<string, number>();

    allOrders.forEach((order) => {
      if (order.status !== 'completed') {
        return;
      }

      const completedDate = (order.completedAt || order.scheduledDate).slice(0, 10);
      completedCounts.set(completedDate, (completedCounts.get(completedDate) || 0) + 1);
    });

    return Array.from({ length: 7 }, (_, index) => {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + index);
      const dateKey = currentDate.toISOString().slice(0, 10);

      return {
        day: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: completedCounts.get(dateKey) || 0,
      };
    });
  }, [allOrders]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-600';
      case 'high': return 'bg-teal-600 hover:bg-teal-600 dark:bg-teal-500 dark:hover:bg-teal-500';
      case 'medium': return 'bg-teal-500 hover:bg-teal-500 dark:bg-teal-400 dark:hover:bg-teal-400';
      case 'low': return 'bg-gray-500 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-600';
      default: return 'bg-gray-500 hover:bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-800';
      case 'in-progress': return 'bg-teal-500/10 text-teal-600 border-teal-200 dark:bg-teal-500/20 dark:text-teal-400 dark:border-teal-800';
      case 'assigned': return 'bg-green-500/10 text-green-600 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-800';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  if (!kpis) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-start">
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* KPI Cards */}
      <div className="flex flex-wrap gap-4 items-stretch">
        <Card className="flex-1 min-w-50 rounded-3xl border-none shadow-lg bg-linear-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 text-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 opacity-80" />
            </div>
            <div>
              <div className="text-3xl font-bold">{kpis.activeWorkOrders}</div>
              <div className="text-sm opacity-90 mt-1">{t('dashboard.kpi.active')}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-50 rounded-3xl border-none shadow-lg bg-linear-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
            <div>
              <div className="text-3xl font-bold">AED {(kpis.totalRevenue / 1000).toFixed(1)}k</div>
              <div className="text-sm opacity-90 mt-1">{t('dashboard.kpi.revenue')}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-50 rounded-3xl border-none shadow-lg bg-linear-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
            <div>
              <div className="text-3xl font-bold">{kpis.avgCompletionRate.toFixed(1)}%</div>
              <div className="text-sm opacity-90 mt-1">{t('dashboard.kpi.completion')}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-50 rounded-3xl border-none shadow-lg bg-linear-to-br from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-600 text-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 opacity-80" />
            </div>
            <div>
              <div className="text-3xl font-bold">{kpis.totalTechnicians}</div>
              <div className="text-sm opacity-90 mt-1">{t('dashboard.kpi.technicians')}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-50 rounded-3xl border-none shadow-lg bg-linear-to-br from-teal-300 to-teal-400 dark:from-teal-400 dark:to-teal-500 text-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 opacity-80" />
            </div>
            <div>
              <div className="text-3xl font-bold">{kpis.completedToday}</div>
              <div className="text-sm opacity-90 mt-1">{t('dashboard.kpi.completed')}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {role === 'admin' && (
        <Card className="rounded-3xl border-none shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pending Customer Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingSubmittedOrders.length === 0 ? (
              <p className="text-sm text-gray-500">No submitted requests waiting for approval.</p>
            ) : (
              pendingSubmittedOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold">{order.id} - {order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.serviceType} | {order.scheduledDate}</p>
                  </div>
                  <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200" variant="outline">submitted</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="flex flex-wrap gap-6 items-stretch">
        {/* Weekly Completion Trend */}
        <Card className="flex-1 min-w-100 rounded-3xl border-none shadow-lg flex flex-col">
          <CardHeader>
            <CardTitle>{t('dashboard.chart.weekly')}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center" dir="ltr">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyCompletionData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#888" />
                <YAxis stroke="#888" width={50} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
                  }} 
                />
                <Bar dataKey="completed" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Distribution */}
        <Card className="flex-1 min-w-75 rounded-3xl border-none shadow-lg flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>
                {selectedCategory ? `${selectedCategory} Services` : t('dashboard.chart.distribution')}
              </CardTitle>
              {selectedCategory && (
                <button
                  onClick={resetToCategories}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Back to Categories
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={275}>
              <PieChart>
                <Pie
                  key={selectedCategory || 'categories'}
                  data={pieData}
                  cx="50%"
                  cy="56%"
                  innerRadius={62}
                  outerRadius={selectedCategory ? 120 : 108}
                  paddingAngle={selectedCategory ? 0 : 5}
                  dataKey="value"
                  activeIndex={activeSliceIndex !== null ? activeSliceIndex : undefined}
                  activeShape={renderActiveSlice}
                  isAnimationActive
                  animationDuration={280 * POP_ANIMATION_SCALE}
                  animationEasing="ease-out"
                  onMouseEnter={(_, index) => setActiveSliceIndex(index)}
                  onMouseLeave={() => setActiveSliceIndex(null)}
                  onClick={(entry: DistributionSlice) => {
                    if (entry.type === 'category' && !isAnimating) {
                      handleSliceSelection(entry.category);
                    }
                  }}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`${entry.type}-${entry.parentCategory || entry.category}-${entry.name}`}
                      fill={entry.color}
                      fillOpacity={getSliceOpacity(index)}
                      stroke="var(--card)"
                      strokeWidth={selectedCategory ? (entry.type === 'category' ? 5 : 0) : 2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-8 space-y-1">
              {legendData.map((item) => {
                const index = pieData.findIndex((slice) => slice.name === item.name && slice.parentCategory === item.parentCategory && slice.type === item.type);
                const isActiveRow = activeSliceIndex === index;
                return (
                <div
                  key={`${item.type}-${item.parentCategory || item.category}-${item.name}`}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-all duration-220 ease-out cursor-pointer ${isActiveRow ? 'bg-gray-50/80 dark:bg-gray-700/50' : ''} ${item.parentCategory === selectedCategory ? 'ring-1 ring-teal-300/55' : ''}`}
                  onMouseEnter={() => setActiveSliceIndex(index)}
                  onMouseLeave={() => setActiveSliceIndex(null)}
                  onClick={() => {
                    if (item.type === 'category') {
                      handleSliceSelection(item.category);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color, opacity: getSliceOpacity(index) }}></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {item.type === 'service' ? 'Service' : `${item.value} services`} ({item.type === 'service' ? getPiePercentage(item.value) : getLegendPercentage(item.value)}%)
                  </span>
                </div>
              );})}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Work Orders */}
      <Card className="rounded-3xl border-none shadow-lg flex flex-col">
        <CardHeader className="shrink-0">
          <CardTitle>{t('dashboard.chart.recent')}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="space-y-4 flex-1">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-1 h-14 rounded-full ${getPriorityColor(order.priority)}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{order.id}</span>
                      <Badge className={getStatusColor(order.status)} variant="outline">
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.customerName} • {order.serviceType}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{order.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg">AED {order.estimatedCost}</div>
                  <p className="text-xs text-gray-500">{order.scheduledDate}</p>
                  {order.technicianName && (
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">{order.technicianName}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trend */}
      <Card className="rounded-3xl border-none shadow-lg flex flex-col">
        <CardHeader className="shrink-0">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle>{t('dashboard.chart.revenue')}</CardTitle>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setRevenuePeriod('day')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  revenuePeriod === 'day'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t('dashboard.chart.day')}
              </button>
              <button
                onClick={() => setRevenuePeriod('week')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  revenuePeriod === 'week'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t('dashboard.chart.week')}
              </button>
              <button
                onClick={() => setRevenuePeriod('month')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  revenuePeriod === 'month'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t('dashboard.chart.month')}
              </button>
              <button
                onClick={() => setRevenuePeriod('year')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  revenuePeriod === 'year'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t('dashboard.chart.year')}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center" dir="ltr">
            <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueTrend} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" stroke="#888" />
              <YAxis stroke="#888" width={50} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}