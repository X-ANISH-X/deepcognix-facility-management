import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import { api as mockApi, type WorkOrder, type Technician, type RevenueStats, type PreviousCustomer, type CustomerReportRow, type Service, type BookingTask } from '@/app/services/api';
import { useLanguage } from '@/app/context/LanguageContext';
import { Download, Filter, FileText, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

const emptyRevenueStats: RevenueStats = {
  totalRevenue: 0,
  pendingRevenue: 0,
  dailyRevenue: [],
  trendData: [],
  trendPeriod: 'week',
};

const buildDateRange = (start: string, end: string): string[] => {
  if (!start || !end) {
    return [];
  }

  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
    return [];
  }

  const dates: string[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export function ReportsView() {
  const { t } = useLanguage();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [reportType, setReportType] = useState<'date' | 'technician' | 'service' | 'customer'>('date');
  const todayIso = new Date().toISOString().slice(0, 10);
  const firstOfYear = `${new Date().getFullYear()}-01-01`;
  const [startDate, setStartDate] = useState(firstOfYear);
  const [endDate, setEndDate] = useState(todayIso);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [revenueStats, setRevenueStats] = useState<RevenueStats>(emptyRevenueStats);
  const [previousCustomers, setPreviousCustomers] = useState<PreviousCustomer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedOngoingBookingId, setSelectedOngoingBookingId] = useState('');
  const [bookingTasks, setBookingTasks] = useState<BookingTask[]>([]);
  const [isLoadingBookingTasks, setIsLoadingBookingTasks] = useState(false);
  const [dateBreakdownMode, setDateBreakdownMode] = useState<'category' | 'service'>('category');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customerSearch, setCustomerSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    orderId: '',
    customerId: '',
    customerName: '',
    package: '',
    technician: '',
    email: '',
    phone: '',
  });

  const loadData = async (showLoader = false, silent = true) => {
    if (showLoader) {
      setIsLoading(true);
    }
    try {
      const [orders, techs, revenue, customers, serviceList] = await Promise.all([
        mockApi.getWorkOrders(),
        mockApi.getTechnicians(),
        mockApi.getRevenueStats(),
        mockApi.getPreviousCustomers(),
        mockApi.getServices(),
      ]);
      setWorkOrders(orders);
      setTechnicians(techs);
      setRevenueStats(revenue);
      setPreviousCustomers(customers);
      setServices(serviceList);
    } catch (error) {
      if (!silent) {
        const message = error instanceof Error ? error.message : 'Failed to load reports';
        toast.error(message);
      }
      setWorkOrders([]);
      setTechnicians([]);
      setRevenueStats(emptyRevenueStats);
      setPreviousCustomers([]);
      setServices([]);
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

  const handleExportCSV = async () => {
    // Export an XLSX workbook with three sheets: Date, Technician, Customer using exceljs.
    try {
      const excelModule = await import('exceljs');
      const ExcelJS = (excelModule && (excelModule as any).default) || excelModule;

      const dateSheetData = dateWiseArray.map((d) => ({ Date: d.date, CompletedOrders: d.count, Revenue: Number(d.revenue).toFixed(2) }));
      const techSheetData = technicianWiseData.map((t) => ({ Technician: t.name, TotalJobs: t.totalJobs, CompletedJobs: t.completedJobs, Revenue: Number(t.revenue).toFixed(2), CompletionRate: t.completionRate }));
      const customerSheetData = filteredCustomerReportRows.map((r) => ({ OrderID: r.orderId, CustomerID: r.customerId, CustomerName: r.customerName, Package: r.packageName, Technician: r.technicianName, Email: r.customerEmail, Phone: r.customerPhone, Amount: Number(r.amount).toFixed(2) }));

      const workbook = new ExcelJS.Workbook();

      const addJsonSheet = (name: string, data: Array<Record<string, any>>) => {
        const ws = workbook.addWorksheet(name);
        const headers = Object.keys(data[0] || {});
        if (headers.length === 0) {
          return;
        }
        ws.columns = headers.map((h) => ({ header: h, key: h, width: 18 }));
        data.forEach((row) => ws.addRow(row));
      };

      addJsonSheet('Date', dateSheetData);
      addJsonSheet('Technician', techSheetData);
      addJsonSheet('Customer', customerSheetData);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      const fileName = `reports-${timestamp}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('reports.exportedCSV'));
    } catch (err) {
      console.error(err);
      toast.error('Failed to export workbook.');
    }
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

  const serviceLookup = useMemo(() => {
    return new Map(
      services.map((service) => [service.name.trim().toLowerCase(), service]),
    );
  }, [services]);

  const selectedDateRange = useMemo(() => buildDateRange(startDate, endDate), [startDate, endDate]);

  const categorySummaries = useMemo(() => {
    const categoryMap = new Map<string, { name: string; color: string; services: Service[] }>();

    services.forEach((service) => {
      const categoryName = (service.category || 'Uncategorized').trim() || 'Uncategorized';
      const key = categoryName.toLowerCase();
      const existing = categoryMap.get(key);
      if (existing) {
        existing.services.push(service);
        return;
      }

      categoryMap.set(key, {
        name: categoryName,
        color: service.color || '#3b82f6',
        services: [service],
      });
    });

    return Array.from(categoryMap.values()).sort((left, right) => left.name.localeCompare(right.name));
  }, [services]);

  useEffect(() => {
    if (selectedCategory === 'all' && categorySummaries.length > 0) {
      setSelectedCategory(categorySummaries[0].name);
      return;
    }

    const categoryExists = categorySummaries.some((category) => category.name === selectedCategory);
    if (!categoryExists && categorySummaries.length > 0) {
      setSelectedCategory(categorySummaries[0].name);
    }
  }, [categorySummaries, selectedCategory]);

  const selectedCategorySummary = useMemo(() => {
    if (selectedCategory === 'all') {
      return null;
    }
    return categorySummaries.find((category) => category.name === selectedCategory) || null;
  }, [categorySummaries, selectedCategory]);

  const categoryRevenueSeries = useMemo(() => {
    const completedOrders = filteredWorkOrders.filter((order) => order.status === 'completed');
    const seriesByDate = new Map<string, Record<string, number | string>>();

    selectedDateRange.forEach((date) => {
      seriesByDate.set(date, { date });
    });

    completedOrders.forEach((order) => {
      const matchedService = serviceLookup.get(order.serviceType.trim().toLowerCase());
      const categoryName = (matchedService?.category || 'Uncategorized').trim() || 'Uncategorized';
      const dateKey = order.scheduledDate;
      const bucket = seriesByDate.get(dateKey) || { date: dateKey };
      bucket[categoryName] = (Number(bucket[categoryName]) || 0) + (order.actualCost ?? order.estimatedCost);
      seriesByDate.set(dateKey, bucket);
    });

    return selectedDateRange.map((date) => seriesByDate.get(date) || { date });
  }, [filteredWorkOrders, serviceLookup, selectedDateRange]);

  const selectedCategoryServiceSeries = useMemo(() => {
    if (!selectedCategorySummary) {
      return [];
    }

    const serviceNames = new Set(
      selectedCategorySummary.services.map((service) => service.name.trim().toLowerCase()),
    );
    const completedOrders = filteredWorkOrders.filter((order) => order.status === 'completed');
    const seriesByDate = new Map<string, Record<string, number | string>>();

    selectedDateRange.forEach((date) => {
      seriesByDate.set(date, { date });
    });

    completedOrders.forEach((order) => {
      const matchedService = serviceLookup.get(order.serviceType.trim().toLowerCase());
      if (!matchedService || !serviceNames.has(matchedService.name.trim().toLowerCase())) {
        return;
      }

      const dateKey = order.scheduledDate;
      const bucket = seriesByDate.get(dateKey) || { date: dateKey };
      bucket[matchedService.name] = (Number(bucket[matchedService.name]) || 0) + (order.actualCost ?? order.estimatedCost);
      seriesByDate.set(dateKey, bucket);
    });

    return selectedDateRange.map((date) => seriesByDate.get(date) || { date });
  }, [filteredWorkOrders, selectedCategorySummary, serviceLookup, selectedDateRange]);

  const customerReportRows: CustomerReportRow[] = useMemo(() => {
    return filteredWorkOrders.map((order) => ({
      orderId: order.id,
      customerId: order.customerId,
      customerName: order.customerName || 'N/A',
      customerEmail: order.customerEmail || 'N/A',
      customerPhone: order.customerPhone || 'N/A',
      packageName: order.packageName || 'N/A',
      technicianName: order.technicianName || 'N/A',
      amount: order.actualCost ?? order.estimatedCost,
    }));
  }, [filteredWorkOrders]);

  const filteredCustomerReportRows = useMemo(() => {
    const filters = Object.fromEntries(Object.entries(columnFilters).map(([k, v]) => [k, v.trim().toLowerCase()]));
    return customerReportRows.filter((r) => {
      const orderMatch = !filters.orderId || String(r.orderId).toLowerCase().includes(filters.orderId.replace('#', '')) || String(r.orderId).toLowerCase().includes(filters.orderId);
      const customerIdMatch = !filters.customerId || String(r.customerId).toLowerCase().includes(filters.customerId.replace('#', '')) || String(r.customerId).toLowerCase().includes(filters.customerId);
      const nameMatch = !filters.customerName || (r.customerName || '').toLowerCase().includes(filters.customerName);
      const packageMatch = !filters.package || (r.packageName || '').toLowerCase().includes(filters.package);
      const techMatch = !filters.technician || (r.technicianName || '').toLowerCase().includes(filters.technician);
      const emailMatch = !filters.email || (r.customerEmail || '').toLowerCase().includes(filters.email);
      const phoneMatch = !filters.phone || (r.customerPhone || '').toLowerCase().includes(filters.phone.replace(/[^0-9+]/g, '')) || (r.customerPhone || '').toLowerCase().includes(filters.phone);
      return orderMatch && customerIdMatch && nameMatch && packageMatch && techMatch && emailMatch && phoneMatch;
    });
  }, [customerReportRows, columnFilters]);

  const selectedCustomer = useMemo(() => {
    return previousCustomers.find((customer) => customer.id === selectedCustomerId) || null;
  }, [previousCustomers, selectedCustomerId]);

  const selectedCustomerBookings = useMemo(() => {
    if (!selectedCustomer) {
      return [];
    }

    return workOrders
      .filter((order) => order.customerId === selectedCustomer.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }, [selectedCustomer, workOrders]);

  const selectedCustomerRevenue = useMemo(() => {
    return selectedCustomerBookings
      .filter((order) => order.status === 'completed')
      .reduce((sum, order) => sum + (order.actualCost ?? order.estimatedCost), 0);
  }, [selectedCustomerBookings]);

  const selectedCustomerCompletedBookings = selectedCustomerBookings.filter((order) => order.status === 'completed');
  const ongoingBookings = useMemo(() => {
    const ongoingStatuses = new Set(['approved', 'assigned', 'in-progress', 'admin_review_pending', 'rejection-requested']);
    return selectedCustomerBookings.filter((order) => ongoingStatuses.has(order.status));
  }, [selectedCustomerBookings]);

  const selectedOngoingBooking = useMemo(() => {
    return ongoingBookings.find((booking) => booking.id === selectedOngoingBookingId) || ongoingBookings[0] || null;
  }, [ongoingBookings, selectedOngoingBookingId]);

  useEffect(() => {
    if (!isCustomerModalOpen) {
      setBookingTasks([]);
      setSelectedOngoingBookingId('');
      return;
    }

    if (ongoingBookings.length === 0) {
      setSelectedOngoingBookingId('');
      setBookingTasks([]);
      return;
    }

    if (!selectedOngoingBookingId || !ongoingBookings.some((booking) => booking.id === selectedOngoingBookingId)) {
      setSelectedOngoingBookingId(ongoingBookings[0].id);
    }
  }, [isCustomerModalOpen, ongoingBookings, selectedOngoingBookingId]);

  useEffect(() => {
    const loadBookingTasks = async () => {
      if (!isCustomerModalOpen || !selectedOngoingBooking) {
        setBookingTasks([]);
        return;
      }

      setIsLoadingBookingTasks(true);
      try {
        const tasks = await mockApi.getBookingTasks(selectedOngoingBooking.id);
        setBookingTasks(tasks.sort((left, right) => left.orderIndex - right.orderIndex));
      } catch {
        setBookingTasks([]);
      } finally {
        setIsLoadingBookingTasks(false);
      }
    };

    void loadBookingTasks();
  }, [isCustomerModalOpen, selectedOngoingBooking]);

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

  // Summary Statistics
  const totalOrders = filteredWorkOrders.length;
  const completedOrders = filteredWorkOrders.filter(wo => wo.status === 'completed').length;
  const bookingRevenue = filteredWorkOrders
    .filter(wo => wo.status === 'completed')
    .reduce((sum, wo) => sum + (wo.actualCost ?? wo.estimatedCost), 0);
  const totalRevenue = paymentRevenueInRange > 0 ? paymentRevenueInRange : bookingRevenue;
  const revenueSource = paymentRevenueInRange > 0 ? 'Recorded Bookings' : 'Bookings (fallback)';
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
        <Card className="rounded-3xl border-none shadow-lg bg-linear-to-br from-blue-500 to-blue-600 text-white">
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

        <Card className="rounded-3xl border-none shadow-lg bg-linear-to-br from-green-500 to-green-600 text-white">
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

        <Card className="rounded-3xl border-none shadow-lg bg-linear-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">AED {(totalRevenue / 1000).toFixed(1)}k</div>
                <div className="text-sm opacity-90 mt-1">{t('reports.totalRevenue')}</div>
                <Badge className="mt-2 bg-white/20 text-white hover:bg-white/20">{revenueSource}</Badge>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold tracking-wide">
                AED
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg bg-linear-to-br from-orange-500 to-orange-600 text-white">
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
                  <SelectItem value="customer">Customer Reports</SelectItem>
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
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>{t('reports.ordersByDate')}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={dateBreakdownMode === 'category' ? 'default' : 'outline'}
                    className="rounded-full"
                    onClick={() => setDateBreakdownMode('category')}
                  >
                    Categories
                  </Button>
                  <Button
                    type="button"
                    variant={dateBreakdownMode === 'service' ? 'default' : 'outline'}
                    className="rounded-full"
                    onClick={() => setDateBreakdownMode('service')}
                  >
                    Services
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {dateBreakdownMode === 'category' && categoryRevenueSeries.length > 0 && (
                <div className="overflow-x-auto pb-2">
                  <div style={{ minWidth: Math.max(800, categoryRevenueSeries.length * 15) + 'px' }}>
                    <ResponsiveContainer width="100%" height={420}>
                      <LineChart data={categoryRevenueSeries} margin={{ left: 15, right: 20, top: 10, bottom: 30 }}>
                        <CartesianGrid stroke="var(--chart-grid)" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#888" 
                          angle={-30}
                          textAnchor="end"
                          height={70}
                          interval={Math.max(0, Math.ceil(categoryRevenueSeries.length / 10) - 1)}
                        />
                        <YAxis stroke="#888" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          }}
                          formatter={(value, name) => {
                            return [`AED ${Number(value).toFixed(2)}`, name];
                          }}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                          {categorySummaries.map((category) => (
                          <Line
                            key={category.name}
                            type="monotone"
                            dataKey={category.name}
                            stroke={category.color}
                            strokeWidth={3}
                            dot={{ fill: category.color, r: 5 }}
                            connectNulls
                            name={category.name}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {dateBreakdownMode === 'service' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-gray-500">
                      {categorySummaries.length === 0 ? 'No services found.' : 'Pick a category to drill into individual services.'}
                    </div>
                    <div className="w-full md:w-80">
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorySummaries.map((category) => (
                            <SelectItem key={category.name} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedCategorySummary && selectedCategoryServiceSeries.length > 0 ? (
                    <div className="overflow-x-auto pb-2">
                      <div style={{ minWidth: Math.max(800, selectedCategoryServiceSeries.length * 15) + 'px' }}>
                        <ResponsiveContainer width="100%" height={420}>
                          <LineChart data={selectedCategoryServiceSeries} margin={{ left: 15, right: 20, top: 10, bottom: 30 }}>
                            <CartesianGrid stroke="var(--chart-grid)" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#888" 
                              angle={-30}
                              textAnchor="end"
                              height={70}
                              interval={Math.max(0, Math.ceil(selectedCategoryServiceSeries.length / 10) - 1)}
                            />
                            <YAxis stroke="#888" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                              }}
                              formatter={(value, name) => {
                                return [`AED ${Number(value).toFixed(2)}`, name];
                              }}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            {selectedCategorySummary.services.map((service) => (
                              <Line
                                key={service.name}
                                type="monotone"
                                dataKey={service.name}
                                stroke={service.color || '#3b82f6'}
                                strokeWidth={3}
                                dot={{ fill: service.color || '#3b82f6', r: 5 }}
                                connectNulls
                                name={service.name}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No revenue data for the selected category and date range.</p>
                  )}
                </div>
              )}
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

      {reportType === 'customer' && (
        <Card className="rounded-3xl border-none shadow-lg">
          <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Customer Reports</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500 hidden sm:block">Tap on a row for additional details</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Type in any header box to filter that column. Filters combine together, so matching Order ID and Customer Name narrows the rows to both values.
              </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-275 text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-3 pr-4">
                      <input
                        placeholder="Order ID"
                        value={columnFilters.orderId}
                        onChange={(e) => setColumnFilters({ ...columnFilters, orderId: e.target.value })}
                        className="w-36 rounded-md border px-2 py-1 text-sm font-medium placeholder:font-medium placeholder:text-[0.95rem] placeholder:text-gray-500"
                      />
                    </th>
                    <th className="py-3 pr-4">
                      <input
                        placeholder="Customer ID"
                        value={columnFilters.customerId}
                        onChange={(e) => setColumnFilters({ ...columnFilters, customerId: e.target.value })}
                        className="w-36 rounded-md border px-2 py-1 text-sm font-medium placeholder:font-medium placeholder:text-[0.95rem] placeholder:text-gray-500"
                      />
                    </th>
                    <th className="py-3 pr-4">
                      <input
                        placeholder="Customer Name"
                        value={columnFilters.customerName}
                        onChange={(e) => setColumnFilters({ ...columnFilters, customerName: e.target.value })}
                        className="w-48 rounded-md border px-2 py-1 text-sm font-medium placeholder:font-medium placeholder:text-[0.95rem] placeholder:text-gray-500"
                      />
                    </th>
                    <th className="py-3 pr-4">
                      <input
                        placeholder="Package"
                        value={columnFilters.package}
                        onChange={(e) => setColumnFilters({ ...columnFilters, package: e.target.value })}
                        className="w-36 rounded-md border px-2 py-1 text-sm font-medium placeholder:font-medium placeholder:text-[0.95rem] placeholder:text-gray-500"
                      />
                    </th>
                    <th className="py-3 pr-4">
                      <input
                        placeholder="Technician"
                        value={columnFilters.technician}
                        onChange={(e) => setColumnFilters({ ...columnFilters, technician: e.target.value })}
                        className="w-36 rounded-md border px-2 py-1 text-sm font-medium placeholder:font-medium placeholder:text-[0.95rem] placeholder:text-gray-500"
                      />
                    </th>
                    <th className="py-3 pr-4">
                      <input
                        placeholder="Email"
                        value={columnFilters.email}
                        onChange={(e) => setColumnFilters({ ...columnFilters, email: e.target.value })}
                        className="w-48 rounded-md border px-2 py-1 text-sm font-medium placeholder:font-medium placeholder:text-[0.95rem] placeholder:text-gray-500"
                      />
                    </th>
                    <th className="py-3 pr-4">
                      <input
                        placeholder="Phone"
                        value={columnFilters.phone}
                        onChange={(e) => setColumnFilters({ ...columnFilters, phone: e.target.value })}
                        className="w-36 rounded-md border px-2 py-1 text-sm font-medium placeholder:font-medium placeholder:text-[0.95rem] placeholder:text-gray-500"
                      />
                    </th>
                    <th className="py-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomerReportRows.map((row) => (
                    <tr
                      key={row.orderId}
                      className="cursor-pointer border-b last:border-none hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      onClick={() => {
                        setSelectedCustomerId(row.customerId);
                        setIsCustomerModalOpen(true);
                      }}
                    >
                      <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">#{row.orderId}</td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">#{row.customerId}</td>
                      <td className="py-3 pr-4">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedCustomerId(row.customerId);
                            setIsCustomerModalOpen(true);
                          }}
                          className="font-medium text-left text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
                        >
                          {row.customerName}
                        </button>
                      </td>
                      <td className="py-3 pr-4">{row.packageName}</td>
                      <td className="py-3 pr-4">{row.technicianName}</td>
                      <td className="py-3 pr-4">{row.customerEmail}</td>
                      <td className="py-3 pr-4">{row.customerPhone}</td>
                      <td className="py-3">AED {row.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {customerReportRows.length === 0 && (
              <p className="pt-4 text-sm text-gray-500">No customer report rows found for the current filters.</p>
            )}
          </CardContent>
        </Card>
      )}

      {isCustomerModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500">Customer Deep Dive</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCustomer.fullName || 'N/A'}</h3>
                <p className="text-sm text-gray-500">Tap a customer report row to inspect bookings and checklist progress.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Customer ID</div>
                  <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">#{selectedCustomer.id}</div>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Total Bookings</div>
                  <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{selectedCustomerBookings.length}</div>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Completed</div>
                  <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{selectedCustomerCompletedBookings.length}</div>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Total Revenue</div>
                  <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">AED {selectedCustomerRevenue.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Name</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{selectedCustomer.fullName || 'N/A'}</div>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Email</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{selectedCustomer.email || 'N/A'}</div>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Phone</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{selectedCustomer.phone || 'N/A'}</div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
                <table className="w-full min-w-225 text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-gray-500 dark:border-gray-700 dark:bg-gray-800/70">
                      <th className="py-3 pr-4 pl-4">Booking ID</th>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Service / Package</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCustomerBookings.map((booking) => (
                      <tr key={booking.id} className="border-b last:border-none dark:border-gray-800">
                        <td className="py-3 pr-4 pl-4 font-medium text-gray-900 dark:text-gray-100">#{booking.id}</td>
                        <td className="py-3 pr-4">{booking.scheduledDate}</td>
                        <td className="py-3 pr-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{booking.serviceType}</div>
                          <div className="text-xs text-gray-500">{booking.packageName || 'N/A'}</div>
                        </td>
                        <td className="py-3 pr-4 capitalize text-gray-600 dark:text-gray-300">{booking.status.replace(/-/g, ' ')}</td>
                        <td className="py-3 pr-4">AED {(booking.actualCost ?? booking.estimatedCost).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedCustomerBookings.length === 0 && (
                <p className="text-sm text-gray-500">This customer has no booking history in the current data set.</p>
              )}

              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Ongoing Service Package</h4>
                    <p className="text-sm text-gray-500">Choose an active booking to see checklist progress reported by the technician.</p>
                  </div>
                  <div className="w-full md:w-96">
                    <Select
                      value={selectedOngoingBooking?.id || ''}
                      onValueChange={setSelectedOngoingBookingId}
                      disabled={ongoingBookings.length === 0}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={ongoingBookings.length === 0 ? 'No ongoing bookings' : 'Select ongoing booking'} />
                      </SelectTrigger>
                      <SelectContent>
                        {ongoingBookings.map((booking) => (
                          <SelectItem key={booking.id} value={booking.id}>
                            #{booking.id} - {booking.serviceType} ({booking.packageName || 'N/A'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedOngoingBooking ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <Badge className="bg-teal-600 text-white hover:bg-teal-600">{selectedOngoingBooking.status.replace(/-/g, ' ')}</Badge>
                        <span>{selectedOngoingBooking.serviceType}</span>
                        <span>•</span>
                        <span>{selectedOngoingBooking.packageName || 'N/A'}</span>
                      </div>
                      {isLoadingBookingTasks ? (
                        <p className="text-sm text-gray-500">Loading checklist...</p>
                      ) : bookingTasks.length > 0 ? (
                        <div className="space-y-2">
                          {bookingTasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{task.taskName}</div>
                                <div className="text-xs text-gray-500">Step {task.orderIndex || task.id}</div>
                              </div>
                              <Badge className={task.isCompleted ? 'bg-emerald-600 text-white hover:bg-emerald-600' : 'bg-amber-500 text-white hover:bg-amber-500'}>
                                {task.isCompleted ? 'Completed' : 'Pending'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No checklist items found for the selected booking.</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">There is no ongoing service package for this customer right now.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
