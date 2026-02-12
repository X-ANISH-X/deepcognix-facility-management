import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { mockApi, type KPIData, type WorkOrder } from '@/app/services/mockApi';
import { mockRevenueData } from '@/app/services/mockRevenueData';
import { useLanguage } from '@/app/context/LanguageContext';
import { Activity, DollarSign, Users, Wrench, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export function DashboardView() {
  const { language, t } = useLanguage();
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [recentOrders, setRecentOrders] = useState<WorkOrder[]>([]);
  const [revenuePeriod, setRevenuePeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');

  useEffect(() => {
    const loadData = async () => {
      const [kpiData, orders] = await Promise.all([
        mockApi.getKPIs(),
        mockApi.getWorkOrders()
      ]);
      setKpis(kpiData);
      setRecentOrders(orders.slice(0, 5));
    };
    loadData();
  }, []);

  const dailyData = mockRevenueData.daily();

  const weeklyData = mockRevenueData.weekly();

  const monthlyData = mockRevenueData.monthly();

  const yearlyData = mockRevenueData.yearly();

  const getRevenueData = () => {
    switch (revenuePeriod) {
      case 'day':
        return dailyData;
      case 'week':
        return weeklyData;
      case 'month':
        return monthlyData;
      case 'year':
        return yearlyData;
      default:
        return weeklyData;
    }
  };

  const serviceDistribution = [
    { name: 'HVAC', value: 35, color: '#14b8a6' },
    { name: 'Plumbing', value: 28, color: '#10b981' },
    { name: 'Electrical', value: 20, color: '#059669' },
    { name: 'Cleaning', value: 17, color: '#2dd4bf' }
  ];

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
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col justify-start">
        <h1 className="text-3xl font-bold tracking-tight">{t('Mission Control')}</h1>
        <p className="text-gray-500 mt-1">{t('Real-time facility management overview')}</p>
      </div>

      {/* KPI Cards */}
      <div className="flex flex-wrap gap-4 items-stretch">
        <Card className="flex-1 min-w-[200px] rounded-3xl border-none shadow-lg bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 text-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 opacity-80" />
            </div>
            <div>
              <div className="text-3xl font-bold">{kpis.activeWorkOrders}</div>
              <div className="text-sm opacity-90 mt-1">{t('Active Work Orders')}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[200px] rounded-3xl border-none shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
            <div>
              <div className="text-3xl font-bold">${(kpis.totalRevenue / 1000).toFixed(1)}k</div>
              <div className="text-sm opacity-90 mt-1">{t('Weekly Revenue')}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[200px] rounded-3xl border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
            <div>
              <div className="text-3xl font-bold">{kpis.avgCompletionRate.toFixed(1)}%</div>
              <div className="text-sm opacity-90 mt-1">Avg Completion Rate</div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[200px] rounded-3xl border-none shadow-lg bg-gradient-to-br from-teal-400 to-teal-500 dark:from-teal-500 dark:to-teal-600 text-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <Wrench className="w-8 h-8 opacity-80" />
            </div>
            <div>
              <div className="text-3xl font-bold">${kpis.maintenanceCostPerGSF}</div>
              <div className="text-sm opacity-90 mt-1">Cost per GSF</div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[200px] rounded-3xl border-none shadow-lg bg-gradient-to-br from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-600 text-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 opacity-80" />
            </div>
            <div>
              <div className="text-3xl font-bold">{kpis.totalTechnicians}</div>
              <div className="text-sm opacity-90 mt-1">{t('Total Technicians')}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[200px] rounded-3xl border-none shadow-lg bg-gradient-to-br from-teal-300 to-teal-400 dark:from-teal-400 dark:to-teal-500 text-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 opacity-80" />
            </div>
            <div>
              <div className="text-3xl font-bold">{kpis.completedToday}</div>
              <div className="text-sm opacity-90 mt-1">Completed Today</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="flex flex-wrap gap-6 items-stretch">
        {/* Weekly Completion Trend */}
        <Card className="flex-1 min-w-[400px] rounded-3xl border-none shadow-lg flex flex-col">
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#888" />
                <YAxis stroke="#888" />
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
        <Card className="flex-1 min-w-[300px] rounded-3xl border-none shadow-lg flex flex-col">
          <CardHeader>
            <CardTitle>{t('Service Distribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
            <div className="grid grid-cols-2 gap-2 mt-4">
              {serviceDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Work Orders */}
      <Card className="rounded-3xl border-none shadow-lg flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>{t('Recent Work Orders')}</CardTitle>
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
                  <div className="font-semibold text-lg">${order.estimatedCost}</div>
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
        <CardHeader className="flex-shrink-0">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle>Revenue Trend</CardTitle>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setRevenuePeriod('day')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  revenuePeriod === 'day'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setRevenuePeriod('week')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  revenuePeriod === 'week'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setRevenuePeriod('month')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  revenuePeriod === 'month'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setRevenuePeriod('year')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  revenuePeriod === 'year'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Year
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={getRevenueData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={revenuePeriod === 'week' ? 'day' : 'label'} stroke="#888" />
              <YAxis stroke="#888" />
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