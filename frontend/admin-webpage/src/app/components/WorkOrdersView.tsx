import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import { api as mockApi, type WorkOrder, type Technician } from '@/app/services/api';
import { useLanguage } from '@/app/context/LanguageContext';
import type { UserRole } from '@/app/utils/accessControl';
import { Plus, Search, Filter, Calendar, MapPin, DollarSign, User, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface WorkOrdersViewProps {
  canManage?: boolean;
  role?: UserRole;
  focusOrderId?: string;
}

export function WorkOrdersView({ canManage = true, role = 'customer', focusOrderId }: WorkOrdersViewProps) {
  const { t } = useLanguage();
  const scheduledTimeSlots = [
    { value: '09:00:00', label: '09:00 AM' },
    { value: '11:00:00', label: '11:00 AM' },
    { value: '13:00:00', label: '01:00 PM' },
    { value: '15:00:00', label: '03:00 PM' },
    { value: '17:00:00', label: '05:00 PM' },
  ];

  const formatScheduledTime = (raw: string): string => {
    if (!raw) return '09:00 AM';
    const normalized = raw.length === 5 ? `${raw}:00` : raw;
    const [hh, mm] = normalized.split(':');
    const hour = Number(hh);
    if (Number.isNaN(hour) || !mm) return raw;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = ((hour + 11) % 12) + 1;
    return `${String(displayHour).padStart(2, '0')}:${mm} ${period}`;
  };

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<WorkOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState<string>('09:00:00');
  const canCreateRequest = role === 'admin' || role === 'customer';

  const loadData = async (showLoader = false, silent = true) => {
    if (showLoader) {
      setIsLoading(true);
    }

    try {
      const [orders, techs] = await Promise.all([
        mockApi.getWorkOrders(),
        mockApi.getTechnicians()
      ]);
      setWorkOrders(orders);
      setTechnicians(techs);
      setFilteredOrders(orders);
    } catch (error) {
      if (!silent) {
        const message = error instanceof Error ? error.message : 'Failed to load work orders';
        toast.error(message);
      }
      setWorkOrders([]);
      setTechnicians([]);
      setFilteredOrders([]);
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData(true, false);

    const unsubscribe = mockApi.subscribeRealtime((event) => {
      const eventName = event.event;
      if (
        eventName === 'booking.created' ||
        eventName === 'booking.assigned' ||
        eventName === 'booking.status_updated' ||
        eventName === 'checklist.item_added' ||
        eventName === 'checklist.item_toggled' ||
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

  useEffect(() => {
    let filtered = workOrders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (focusOrderId) {
      filtered = [...filtered].sort((left, right) => {
        if (left.id === focusOrderId) return -1;
        if (right.id === focusOrderId) return 1;
        return 0;
      });
    }

    setFilteredOrders(filtered);
  }, [focusOrderId, searchTerm, statusFilter, workOrders]);

  const handleCreateOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newOrder = await mockApi.createWorkOrder({
      customerName: formData.get('customerName') as string,
      serviceType: formData.get('serviceType') as string,
      priority: 'medium',
      scheduledDate: formData.get('scheduledDate') as string,
      scheduledTime: scheduledTimeSlot,
      location: formData.get('location') as string,
      buildingName: (formData.get('buildingName') as string) || undefined,
      floorNumber: (formData.get('floorNumber') as string) || undefined,
      apartmentNumber: (formData.get('apartmentNumber') as string) || undefined,
      customerNotes: formData.get('description') as string,
      description: formData.get('description') as string,
    });

    setWorkOrders([...workOrders, newOrder]);
    setIsCreateDialogOpen(false);
    toast.success(t('workorders.createdSuccess'));
  };

  const handleAssignTechnician = async (technicianId: string) => {
    if (!selectedOrder) return;

    const updated = await mockApi.assignWorkOrder(selectedOrder.id, technicianId);
    setWorkOrders(workOrders.map(wo => wo.id === updated.id ? updated : wo));
    setIsAssignDialogOpen(false);
    toast.success(`${t('workorders.assign')}: ${updated.technicianName}`);
  };

  const handleApproveCompletion = async (orderId: string) => {
    const updated = await mockApi.approveWorkOrderCompletion(orderId);
    setWorkOrders(workOrders.map((wo) => wo.id === updated.id ? updated : wo));
    toast.success('Completion request approved');
  };

  const handleApproveRejection = async (orderId: string) => {
    const updated = await mockApi.approveWorkOrderRejection(orderId);
    setWorkOrders(workOrders.map((wo) => wo.id === updated.id ? updated : wo));
    toast.success('Rejection request approved');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-600 border-green-200 dark:bg-green-500/25 dark:text-green-300 dark:border-green-700';
      case 'in-progress': return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/25 dark:text-blue-300 dark:border-blue-700';
      case 'approved': return 'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:bg-indigo-500/25 dark:text-indigo-300 dark:border-indigo-700';
      case 'assigned': return 'bg-purple-500/10 text-purple-600 border-purple-200 dark:bg-purple-500/25 dark:text-purple-300 dark:border-purple-700';
      case 'submitted': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:bg-yellow-500/25 dark:text-yellow-300 dark:border-yellow-700';
      case 'completion-requested': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/25 dark:text-emerald-300 dark:border-emerald-700';
      case 'rejection-requested': return 'bg-rose-500/10 text-rose-600 border-rose-200 dark:bg-rose-500/25 dark:text-rose-300 dark:border-rose-700';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-200 dark:bg-red-500/25 dark:text-red-300 dark:border-red-700';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200 dark:bg-gray-500/25 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getStatusAccentColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 hover:bg-green-500';
      case 'in-progress': return 'bg-blue-500 hover:bg-blue-500';
      case 'approved': return 'bg-indigo-500 hover:bg-indigo-500';
      case 'assigned': return 'bg-purple-500 hover:bg-purple-500';
      case 'submitted': return 'bg-yellow-500 hover:bg-yellow-500';
      case 'completion-requested': return 'bg-emerald-500 hover:bg-emerald-500';
      case 'rejection-requested': return 'bg-rose-500 hover:bg-rose-500';
      case 'cancelled': return 'bg-red-500 hover:bg-red-500';
      default: return 'bg-gray-500 hover:bg-gray-500';
    }
  };

  const getTechnicianStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-600';
      case 'enroute': return 'bg-amber-500 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-600';
      case 'onsite': return 'bg-teal-500 hover:bg-teal-500 dark:bg-teal-600 dark:hover:bg-teal-600';
      default: return 'bg-gray-500 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-600';
    }
  };

  const getTechnicianStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'enroute':
        return 'En Route';
      case 'onsite':
        return 'On Site';
      case 'offline':
        return 'Offline';
      default:
        return status;
    }
  };

  const formatMoney = (amount?: number) => {
    if (typeof amount !== 'number' || Number.isNaN(amount)) {
      return 'AED 0';
    }
    return `AED ${amount}`;
  };

  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-1 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-800/60 px-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 wrap-break-word">{value}</span>
    </div>
  );

  if (isLoading) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">{t('workorders.title')}</h1>
          <p className="text-gray-500 mt-1">{t('workorders.subtitle')}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          {canCreateRequest && (
            <DialogTrigger asChild>
              <Button className="rounded-full bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
                <Plus className="w-4 h-4 mt-0.5" />
                {t('workorders.createBtn')}
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-2xl rounded-3xl">
            <DialogHeader>
              <DialogTitle>{t('workorders.create.title')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrder} className="space-y-4 flex flex-col">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 flex flex-col">
                    <Label htmlFor="customerName" className="mb-2 ml-1">{t('workorders.customerName')}</Label>
                    <Input id="customerName" name="customerName" required className="rounded-xl" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <Label htmlFor="serviceType" className="mb-2 ml-1">{t('workorders.serviceType')}</Label>
                    <Input id="serviceType" name="serviceType" required className="rounded-xl" />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 flex flex-col">
                    <Label htmlFor="scheduledDate" className="mb-2 ml-1">Scheduled Date</Label>
                    <Input id="scheduledDate" name="scheduledDate" type="date" required className="rounded-xl" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <Label htmlFor="scheduledTime" className="mb-2 ml-1">Scheduled Time</Label>
                    <Select value={scheduledTimeSlot} onValueChange={setScheduledTimeSlot}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {scheduledTimeSlots.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col">
                  <Label htmlFor="location" className="mb-2 ml-1">Location</Label>
                  <Input id="location" name="location" required className="rounded-xl" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <Label htmlFor="buildingName" className="mb-2 ml-1">Building</Label>
                    <Input id="buildingName" name="buildingName" className="rounded-xl" />
                  </div>
                  <div className="flex flex-col">
                    <Label htmlFor="floorNumber" className="mb-2 ml-1">Floor</Label>
                    <Input id="floorNumber" name="floorNumber" className="rounded-xl" />
                  </div>
                  <div className="flex flex-col">
                    <Label htmlFor="apartmentNumber" className="mb-2 ml-1">Apartment</Label>
                    <Input id="apartmentNumber" name="apartmentNumber" className="rounded-xl" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <Label htmlFor="description" className="mb-2 ml-1">Description</Label>
                  <Textarea id="description" name="description" rows={4} required className="rounded-xl" />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="rounded-full">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-full bg-blue-600 hover:bg-blue-700">
                  Create Order
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {role === 'customer' && (
        <Card className="rounded-3xl border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">My Request History</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 p-3">
              <div className="text-xs text-yellow-700 dark:text-yellow-300">Submitted</div>
              <div className="text-xl font-bold">{workOrders.filter((order) => order.status === 'submitted').length}</div>
            </div>
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 p-3">
              <div className="text-xs text-indigo-700 dark:text-indigo-300">Approved/Assigned</div>
              <div className="text-xl font-bold">{workOrders.filter((order) => order.status === 'approved' || order.status === 'assigned').length}</div>
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3">
              <div className="text-xs text-blue-700 dark:text-blue-300">In Progress</div>
              <div className="text-xl font-bold">{workOrders.filter((order) => order.status === 'in-progress').length}</div>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
              <div className="text-xs text-emerald-700 dark:text-emerald-300">Completed</div>
              <div className="text-xl font-bold">{workOrders.filter((order) => order.status === 'completed').length}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="rounded-3xl border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>

              <div className="flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completion-requested">Completion Requested</SelectItem>
                    <SelectItem value="rejection-requested">Rejection Requested</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" className="rounded-xl whitespace-nowrap">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="rounded-3xl border-none shadow-lg hover:shadow-xl transition-shadow flex flex-col">
            <CardContent className="p-6 flex flex-col flex-1">
              <div className="flex flex-col md:flex-row items-start justify-between mb-4 gap-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-1.5 h-16 rounded-full ${getStatusAccentColor(order.status)}`}></div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{order.id}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.customerName}</p>
                  </div>
                </div>
                <Badge className={`${getStatusColor(order.status)} whitespace-nowrap`} variant="outline">
                  {order.status}
                </Badge>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">{order.serviceType}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">{order.location}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">{order.scheduledDate} at {formatScheduledTime(order.scheduledTime)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">AED {order.estimatedCost}</span>
                </div>

                {order.technicianName && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">{order.technicianName}</span>
                  </div>
                )}

                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 line-clamp-2">{order.description}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                {canManage && (order.status === 'submitted' || order.status === 'approved') && (
                  <Button 
                    onClick={() => { setSelectedOrder(order); setIsAssignDialogOpen(true); }}
                    className="flex-1 min-w-37.5 rounded-full bg-blue-600 hover:bg-blue-700 dark:text-white"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Assign Technician
                  </Button>
                )}
                {canManage && order.status === 'assigned' && (
                  <Button 
                    onClick={() => { setSelectedOrder(order); setIsAssignDialogOpen(true); }}
                    variant="outline"
                    className="flex-1 min-w-37.5 rounded-full"
                  >
                    Reassign
                  </Button>
                )}
                {canManage && order.status === 'completion-requested' && (
                  <Button
                    onClick={() => void handleApproveCompletion(order.id)}
                    className="flex-1 min-w-37.5 rounded-full bg-emerald-600 hover:bg-emerald-700 dark:text-white"
                  >
                    Approve Completion
                  </Button>
                )}
                {canManage && order.status === 'rejection-requested' && (
                  <Button
                    onClick={() => void handleApproveRejection(order.id)}
                    className="flex-1 min-w-37.5 rounded-full bg-rose-600 hover:bg-rose-700 dark:text-white"
                  >
                    Approve Rejection
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 min-w-37.5 rounded-full"
                  onClick={() => { setSelectedOrder(order); setIsDetailsDialogOpen(true); }}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assign Technician Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Assign Technician to {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-800/60 p-4">
              <DetailRow label="Customer Notes" value={selectedOrder.customerNotes || 'No special instructions provided.'} />
              <DetailRow label="Preferred Technician" value={selectedOrder.preferredTechnician || 'No preference'} />
              <DetailRow label="Parking Instructions" value={selectedOrder.parkingInstructions || 'No parking notes'} />
              <DetailRow label="Pet Warning" value={selectedOrder.petWarning || 'No pet warning'} />
              <DetailRow label="Call Before Arrival" value={selectedOrder.callBeforeArrival ? 'Yes' : 'No'} />
            </div>
          )}
          <div className="space-y-3 max-h-96 overflow-y-auto flex flex-col">
            {technicians
              .filter(tech => tech.status !== 'offline')
              .map((tech) => (
                <div
                  key={tech.id}
                  onClick={() => canManage && handleAssignTechnician(tech.id)}
                  className={`p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-blue-950/40 transition-colors border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-600 flex flex-col ${canManage ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className={`w-12 h-12 ${getTechnicianStatusColor(tech.status)} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
                      {tech.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{tech.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge className={`${getTechnicianStatusColor(tech.status)} text-white`} variant="secondary">
                          {getTechnicianStatusLabel(tech.status)}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {tech.currentJobs} active job{tech.currentJobs !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-green-600">{tech.completionRate}%</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">completion</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tech.specialty.map((spec: string) => (
                      <Badge key={spec} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Work Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Work Order Details</DialogTitle>
          </DialogHeader>

          {selectedOrder ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Booking</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedOrder.id}</h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">{selectedOrder.customerName}</p>
                </div>
                <Badge className={`${getStatusColor(selectedOrder.status)} whitespace-nowrap`} variant="outline">
                  {selectedOrder.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow label="Service" value={selectedOrder.serviceType} />
                <DetailRow label="Estimated Cost" value={formatMoney(selectedOrder.estimatedCost)} />
                <DetailRow label="Schedule" value={`${selectedOrder.scheduledDate} at ${formatScheduledTime(selectedOrder.scheduledTime)}`} />
                <DetailRow label="Location" value={selectedOrder.location} />
                <DetailRow label="Building" value={selectedOrder.buildingName || 'N/A'} />
                <DetailRow label="Floor / Apartment" value={`${selectedOrder.floorNumber || 'N/A'} / ${selectedOrder.apartmentNumber || 'N/A'}`} />
                <DetailRow label="Technician" value={selectedOrder.technicianName || 'Not assigned yet'} />
                <DetailRow label="Created At" value={new Date(selectedOrder.createdAt).toLocaleString()} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailRow label="Priority" value={selectedOrder.priority} />
                <DetailRow label="Actual Cost" value={selectedOrder.actualCost ? formatMoney(selectedOrder.actualCost) : 'Pending'} />
                <DetailRow label="Preferred Technician" value={selectedOrder.preferredTechnician || 'No preference'} />
                <DetailRow label="Call Before Arrival" value={selectedOrder.callBeforeArrival ? 'Yes' : 'No'} />
                <DetailRow label="Parking Instructions" value={selectedOrder.parkingInstructions || 'No parking notes'} />
                <DetailRow label="Pet Warning" value={selectedOrder.petWarning || 'No pet warning'} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-800/60 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</span>
                  <p className="mt-2 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{selectedOrder.description}</p>
                </div>
                <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-800/60 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Customer Notes</span>
                  <p className="mt-2 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{selectedOrder.customerNotes || 'No customer notes provided.'}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                {canManage && (selectedOrder.status === 'submitted' || selectedOrder.status === 'approved') && (
                  <Button
                    onClick={() => {
                      setIsDetailsDialogOpen(false);
                      setIsAssignDialogOpen(true);
                    }}
                    className="rounded-full bg-blue-600 hover:bg-blue-700 dark:text-white"
                  >
                    Assign Technician
                  </Button>
                )}
                <Button variant="outline" className="rounded-full" onClick={() => setIsDetailsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {filteredOrders.length === 0 && (
        <Card className="rounded-3xl border-none shadow-lg">
          <CardContent className="p-12 flex items-center justify-center">
            <p className="text-gray-500">{t('workorders.noOrders')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
