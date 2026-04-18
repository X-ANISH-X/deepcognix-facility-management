import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import { api as mockApi, type WorkOrder, type Technician, type RevenueStats } from '@/app/services/api';
import { useLanguage } from '@/app/context/LanguageContext';
import { Download, Filter, FileText, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

const emptyRevenueStats: RevenueStats = {
  totalRevenue: 0,
  pendingRevenue: 0,
  dailyRevenue: [],
  trendData: [],
  trendPeriod: 'week',
};

export function ReportsView() {
  const { t } = useLanguage();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [reportType, setReportType] = useState<'date' | 'technician' | 'service'>('date');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-31');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [revenueStats, setRevenueStats] = useState<RevenueStats>(emptyRevenueStats);

  const loadData = async (showLoader = false, silent = true) => {
    if (showLoader) {
      setIsLoading(true);
    }
    try {
      const [orders, techs, revenue] = await Promise.all([
        mockApi.getWorkOrders(),
        mockApi.getTechnicians(),
        mockApi.getRevenueStats(),
      ]);
      setWorkOrders(orders);
      setTechnicians(techs);
      setRevenueStats(revenue);
    } catch (error) {
      if (!silent) {
        const message = error instanceof Error ? error.message : 'Failed to load reports';
        toast.error(message);
      }
      setWorkOrders([]);
      setTechnicians([]);
      setRevenueStats(emptyRevenueStats);
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadData(true, false);

    const unsubscribe = mockApi.subscribeRealtime((event) => {
      const eventName = event.event;
      if (
        eventName === 'booking.created' ||
        eventName === 'booking.assigned' ||
        eventName === 'booking.status_updated' ||
        eventName === 'technician.status_updated'
      ) {
        void loadData(false, true);
      }
    });

    const pollTimer = window.setInterval(() => {
      void loadData(false, true);
    }, 10000);

    return () => {
      unsubscribe();
      window.clearInterval(pollTimer);
    };
  }, []);

  const downloadBlob = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const csvEscape = (value: string | number | undefined) => {
    const text = value === undefined ? '' : String(value);
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push(`Report Type,${csvEscape(reportType)}`);
    lines.push(`Start Date,${csvEscape(startDate)}`);
    lines.push(`End Date,${csvEscape(endDate)}`);
    lines.push(`Revenue Source,${csvEscape(revenueSource)}`);
    lines.push('');
    lines.push('Order ID,Date,Status,Service,Technician,Revenue');

    filteredWorkOrders.forEach((order) => {
      const orderRevenue = order.actualCost ?? order.estimatedCost;
      lines.push([
        csvEscape(order.id),
        csvEscape(order.scheduledDate),
        csvEscape(order.status),
        csvEscape(order.serviceType),
        csvEscape(order.technicianName || ''),
        csvEscape(orderRevenue),
      ].join(','));
    });

    lines.push('');
    lines.push('Summary Metric,Value');
    lines.push(`Total Orders,${csvEscape(totalOrders)}`);
    lines.push(`Completed Orders,${csvEscape(completedOrders)}`);
    lines.push(`Total Revenue,${csvEscape(totalRevenue.toFixed(2))}`);
    lines.push(`Average Order Value,${csvEscape(avgOrderValue.toFixed(2))}`);

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadBlob(lines.join('\n'), `reports-${timestamp}.csv`, 'text/csv;charset=utf-8');
    toast.success(t('reports.exportedCSV'));
  };

  const handleExportPDF = () => {
    const html = `
      <html>
        <head>
          <title>Reports Export</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin: 0 0 8px 0; }
            p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Operations Report</h1>
          <p><strong>Type:</strong> ${reportType}</p>
          <p><strong>Date Range:</strong> ${startDate} to ${endDate}</p>
          <p><strong>Revenue Source:</strong> ${revenueSource}</p>
          <p><strong>Total Orders:</strong> ${totalOrders}</p>
          <p><strong>Completed Orders:</strong> ${completedOrders}</p>
          <p><strong>Total Revenue:</strong> AED ${totalRevenue.toFixed(2)}</p>
          <p><strong>Average Order Value:</strong> AED ${avgOrderValue.toFixed(2)}</p>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Service</th>
                <th>Technician</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${filteredWorkOrders.map((order) => `
                <tr>
                  <td>${order.id}</td>
                  <td>${order.scheduledDate}</td>
                  <td>${order.status}</td>
                  <td>${order.serviceType}</td>
                  <td>${order.technicianName || ''}</td>
                  <td>AED ${(order.actualCost ?? order.estimatedCost).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const popup = window.open('', '_blank', 'width=1000,height=800');
    if (!popup) {
      toast.error('Popup blocked. Allow popups to print/export PDF.');
      return;
    }

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
    toast.success(t('reports.exportedPDF'));
  };

  const serviceOptions = useMemo(() => {
    return [...new Set(workOrders.map((wo) => wo.serviceType).filter(Boolean))].sort((left, right) => left.localeCompare(right));
  }, [workOrders]);

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const inDateRange = (!startDate || wo.scheduledDate >= startDate) && (!endDate || wo.scheduledDate <= endDate);
      const technicianMatch = selectedTechnician === 'all' || wo.technicianId === selectedTechnician;
      const serviceMatch = selectedService === 'all' || wo.serviceType === selectedService;
      return inDateRange && technicianMatch && serviceMatch;
    });
  }, [workOrders, startDate, endDate, selectedTechnician, selectedService]);

  const paymentRevenueInRange = useMemo(() => {
    return revenueStats.dailyRevenue
      .filter((entry) => (!startDate || entry.date >= startDate) && (!endDate || entry.date <= endDate))
      .reduce((sum, entry) => sum + entry.revenue, 0);
  }, [revenueStats, startDate, endDate]);

  // Date-wise report data
  const dateWiseData = filteredWorkOrders
    .filter(wo => wo.status === 'completed')
    .reduce((acc, wo) => {
      const date = wo.scheduledDate;
      if (!acc[date]) {
        acc[date] = { date, count: 0, revenue: 0 };
      }
      acc[date].count += 1;
      acc[date].revenue += wo.actualCost ?? wo.estimatedCost;
      return acc;
    }, {} as Record<string, { date: string; count: number; revenue: number }>);

  const dateWiseArray = (Object.values(dateWiseData) as Array<{ date: string; count: number; revenue: number }>).sort((a, b) => a.date.localeCompare(b.date));

  const paymentDateWiseArray = useMemo(() => {
    return revenueStats.dailyRevenue
      .filter((entry) => (!startDate || entry.date >= startDate) && (!endDate || entry.date <= endDate))
      .map((entry) => ({ date: entry.date, revenue: entry.revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [revenueStats.dailyRevenue, startDate, endDate]);

  const revenueDateSeries = paymentDateWiseArray.length > 0
    ? paymentDateWiseArray
    : dateWiseArray.map((entry) => ({ date: entry.date, revenue: entry.revenue }));

  // Technician-wise report data
  const technicianWiseData = technicians
    .filter((tech) => selectedTechnician === 'all' || tech.id === selectedTechnician)
    .map(tech => {
    const techOrders = filteredWorkOrders.filter(wo => wo.technicianId === tech.id);
    const completed = techOrders.filter(wo => wo.status === 'completed');
    const revenue = completed.reduce((sum, wo) => sum + (wo.actualCost ?? wo.estimatedCost), 0);
    
    return {
      name: tech.name,
      totalJobs: techOrders.length,
      completedJobs: completed.length,
      revenue,
      completionRate: tech.completionRate
    };
  });

  // Service-wise report data
  const serviceWiseData = filteredWorkOrders.reduce((acc, wo) => {
    if (!acc[wo.serviceType]) {
      acc[wo.serviceType] = { service: wo.serviceType, count: 0, revenue: 0 };
    }
    acc[wo.serviceType].count += 1;
    if (wo.status === 'completed') {
      acc[wo.serviceType].revenue += wo.actualCost ?? wo.estimatedCost;
    }
    return acc;
  }, {} as Record<string, { service: string; count: number; revenue: number }>);

  const serviceWiseArray = (Object.values(serviceWiseData) as Array<{ service: string; count: number; revenue: number }>).sort((a, b) => b.revenue - a.revenue);

  // Summary Statistics
  const totalOrders = filteredWorkOrders.length;
  const completedOrders = filteredWorkOrders.filter(wo => wo.status === 'completed').length;
  const bookingRevenue = filteredWorkOrders
    .filter(wo => wo.status === 'completed')
    .reduce((sum, wo) => sum + (wo.actualCost ?? wo.estimatedCost), 0);
  const totalRevenue = paymentRevenueInRange > 0 ? paymentRevenueInRange : bookingRevenue;
  const revenueSource = paymentRevenueInRange > 0 ? 'Payments' : 'Bookings (fallback)';
  const avgOrderValue = completedOrders > 0 ? bookingRevenue / completedOrders : 0;

  if (isLoading) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('reports.title')}</h1>
          <p className="text-gray-500 mt-1">{t('reports.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="rounded-full">
            <Download className="w-4 h-4" />
            {t('reports.exportCSV')}
          </Button>
          <Button onClick={handleExportPDF} className="rounded-full bg-blue-600 hover:bg-blue-700 text-white">
            <FileText className="w-4 h-4" />
            {t('reports.exportPDF')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-3xl border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{totalOrders}</div>
                <div className="text-sm opacity-90 mt-1">{t('reports.totalOrders')}</div>
              </div>
              <FileText className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{completedOrders}</div>
                <div className="text-sm opacity-90 mt-1">{t('reports.completed')}</div>
              </div>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">AED {(totalRevenue / 1000).toFixed(1)}k</div>
                <div className="text-sm opacity-90 mt-1">{t('reports.totalRevenue')}</div>
                <Badge className="mt-2 bg-white/20 text-white hover:bg-white/20">{revenueSource}</Badge>
              </div>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">AED {avgOrderValue.toFixed(0)}</div>
                <div className="text-sm opacity-90 mt-1">{t('reports.avgValue')}</div>
              </div>
              <Calendar className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-3xl border-none shadow-lg ">
        <CardHeader className="pt-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t('reports.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <Label htmlFor="reportType" className="mb-2 ml-1">{t('reports.type')}</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">{t('reports.dateWise')}</SelectItem>
                  <SelectItem value="technician">{t('reports.technicianWise')}</SelectItem>
                  <SelectItem value="service">{t('reports.serviceWise')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate" className="mb-2 ml-1">{t('reports.startDate')}</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="endDate" className="mb-2 ml-1">{t('reports.endDate')}</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="technician" className="mb-2 ml-1">{t('reports.technician')}</Label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('workorders.all')}</SelectItem>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="service" className="mb-2 ml-1">Service</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('workorders.all')}</SelectItem>
                  {serviceOptions.map((service) => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content Based on Type */}
      {reportType === 'date' && (
        <div className="space-y-6">
          <Card className="rounded-3xl border-none shadow-lg">
            <CardHeader>
              <CardTitle>{t('reports.ordersByDate')}</CardTitle>
            </CardHeader>
            <CardContent dir="ltr">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dateWiseArray}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '12px', 
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
                    }} 
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-lg">
            <CardHeader>
              <CardTitle>{t('reports.revenueByDate')}</CardTitle>
            </CardHeader>
            <CardContent dir="ltr">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueDateSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888" />
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
      )}

      {reportType === 'technician' && (
        <Card className="rounded-3xl border-none shadow-lg">
          <CardHeader>
            <CardTitle>{t('reports.technicianPerformance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {technicianWiseData.map((tech) => (
                <div key={tech.name} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{tech.name}</h3>
                      <Badge className="mt-1 bg-blue-500 hover:bg-blue-500 text-white">
                        {tech.completionRate}% {t('reports.completionRateText')}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">AED {tech.revenue}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('reports.totalRevenue')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white dark:bg-gray-700 rounded-xl">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('reports.jobs')}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{tech.totalJobs}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-700 rounded-xl">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('reports.completedOrders')}</p>
                      <p className="text-xl font-bold text-green-600">{tech.completedJobs}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === 'service' && (
        <div className="space-y-6">
          <Card className="rounded-3xl border-none shadow-lg">
            <CardHeader>
              <CardTitle>{t('reports.revenueByServiceType')}</CardTitle>
            </CardHeader>
            <CardContent dir="ltr">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={serviceWiseArray}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="service" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '12px', 
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
                    }} 
                  />
                  <Bar dataKey="revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-lg">
            <CardHeader>
              <CardTitle>{t('reports.servicePerformanceSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {serviceWiseArray.map((service, index) => (
                  <div key={service.service} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{service.service}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{service.count} {t('reports.ordersCount')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">AED {service.revenue}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('reports.revenueLabel')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
