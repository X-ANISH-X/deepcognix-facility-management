import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { mockApi, type WorkOrder, type Technician } from '@/app/services/mockApi';
import { Download, Filter, FileText, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

export function ReportsView() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [reportType, setReportType] = useState<'date' | 'technician' | 'service'>('date');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-31');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      const [orders, techs] = await Promise.all([
        mockApi.getWorkOrders(),
        mockApi.getTechnicians()
      ]);
      setWorkOrders(orders);
      setTechnicians(techs);
    };
    loadData();
  }, []);

  const handleExportCSV = () => {
    toast.success('Report exported as CSV!');
  };

  const handleExportPDF = () => {
    toast.success('Report exported as PDF!');
  };

  // Date-wise report data
  const dateWiseData = workOrders
    .filter(wo => wo.status === 'completed')
    .reduce((acc, wo) => {
      const date = wo.scheduledDate;
      if (!acc[date]) {
        acc[date] = { date, count: 0, revenue: 0 };
      }
      acc[date].count += 1;
      acc[date].revenue += wo.actualCost || 0;
      return acc;
    }, {} as Record<string, { date: string; count: number; revenue: number }>);

  const dateWiseArray = Object.values(dateWiseData).sort((a, b) => a.date.localeCompare(b.date));

  // Technician-wise report data
  const technicianWiseData = technicians.map(tech => {
    const techOrders = workOrders.filter(wo => wo.technicianId === tech.id);
    const completed = techOrders.filter(wo => wo.status === 'completed');
    const revenue = completed.reduce((sum, wo) => sum + (wo.actualCost || 0), 0);
    
    return {
      name: tech.name,
      totalJobs: techOrders.length,
      completedJobs: completed.length,
      revenue,
      completionRate: tech.completionRate
    };
  });

  // Service-wise report data
  const serviceWiseData = workOrders.reduce((acc, wo) => {
    if (!acc[wo.serviceType]) {
      acc[wo.serviceType] = { service: wo.serviceType, count: 0, revenue: 0 };
    }
    acc[wo.serviceType].count += 1;
    if (wo.status === 'completed') {
      acc[wo.serviceType].revenue += wo.actualCost || 0;
    }
    return acc;
  }, {} as Record<string, { service: string; count: number; revenue: number }>);

  const serviceWiseArray = Object.values(serviceWiseData).sort((a, b) => b.revenue - a.revenue);

  // Summary Statistics
  const totalOrders = workOrders.length;
  const completedOrders = workOrders.filter(wo => wo.status === 'completed').length;
  const totalRevenue = workOrders
    .filter(wo => wo.status === 'completed')
    .reduce((sum, wo) => sum + (wo.actualCost || 0), 0);
  const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Export and analyze performance data</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="rounded-full">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleExportPDF} className="rounded-full bg-blue-600 hover:bg-blue-700">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
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
                <div className="text-sm opacity-90 mt-1">Total Orders</div>
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
                <div className="text-sm opacity-90 mt-1">Completed</div>
              </div>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">${(totalRevenue / 1000).toFixed(1)}k</div>
                <div className="text-sm opacity-90 mt-1">Total Revenue</div>
              </div>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">${avgOrderValue.toFixed(0)}</div>
                <div className="text-sm opacity-90 mt-1">Avg Order Value</div>
              </div>
              <Calendar className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-3xl border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date-wise</SelectItem>
                  <SelectItem value="technician">Technician-wise</SelectItem>
                  <SelectItem value="service">Service-wise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="technician">Technician</Label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technicians</SelectItem>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
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
              <CardTitle>Orders by Date</CardTitle>
            </CardHeader>
            <CardContent>
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
              <CardTitle>Revenue by Date</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dateWiseArray}>
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
            <CardTitle>Technician Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {technicianWiseData.map((tech) => (
                <div key={tech.name} className="p-4 rounded-2xl bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{tech.name}</h3>
                      <Badge className="mt-1 bg-blue-500 hover:bg-blue-500 text-white">
                        {tech.completionRate}% completion rate
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">${tech.revenue}</div>
                      <p className="text-sm text-gray-500">Total Revenue</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-xl">
                      <p className="text-sm text-gray-600">Total Jobs</p>
                      <p className="text-xl font-bold">{tech.totalJobs}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl">
                      <p className="text-sm text-gray-600">Completed Jobs</p>
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
              <CardTitle>Revenue by Service Type</CardTitle>
            </CardHeader>
            <CardContent>
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
              <CardTitle>Service Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {serviceWiseArray.map((service, index) => (
                  <div key={service.service} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{service.service}</p>
                        <p className="text-sm text-gray-500">{service.count} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">${service.revenue}</p>
                      <p className="text-sm text-gray-500">Revenue</p>
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
