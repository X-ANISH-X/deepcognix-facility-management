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
import { api, type WorkOrder, type Technician } from '@/app/services/api';
import { Plus, Search, Filter, Calendar, MapPin, DollarSign, User, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function WorkOrdersView() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<WorkOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (showLoader = false) => {
    if (showLoader) {
      setIsLoading(true);
    }
    const [orders, techs] = await Promise.all([
      api.getWorkOrders(),
      api.getTechnicians()
    ]);
    setWorkOrders(orders);
    setTechnicians(techs);
    setFilteredOrders(orders);
    if (showLoader) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const intervalId = window.setInterval(() => {
      loadData(false).catch(() => {
        // Keep the current list visible if a background refresh fails.
      });
    }, 5000);
    return () => window.clearInterval(intervalId);
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

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(order => order.priority === priorityFilter);
    }

    setFilteredOrders(filtered);
  }, [searchTerm, statusFilter, priorityFilter, workOrders]);

  const handleCreateOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Bookings in this system are created by customers via the User App.
    // Admin manages (approve / assign / cancel) existing bookings.
    toast.info('New bookings are submitted by customers via the User App. Use Approve/Assign to manage them here.');
    setIsCreateDialogOpen(false);
  };

  const handleAssignTechnician = async (technicianId: string) => {
    if (!selectedOrder) return;

    const updated = await api.assignWorkOrder(selectedOrder.id, technicianId);
    setWorkOrders(workOrders.map(wo => wo.id === updated.id ? updated : wo));
    setIsAssignDialogOpen(false);
    toast.success(`Assigned to ${updated.technicianName}`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 hover:bg-red-500';
      case 'high': return 'bg-orange-500 hover:bg-orange-500';
      case 'medium': return 'bg-blue-500 hover:bg-blue-500';
      case 'low': return 'bg-gray-500 hover:bg-gray-500';
      default: return 'bg-gray-500 hover:bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'completion-requested': return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
      case 'rejection-requested': return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'in-progress': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'assigned': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading Work Orders..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-gray-500 mt-1">Manage and assign service requests</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-3xl">
            <DialogHeader>
              <DialogTitle>Create New Work Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrder} className="space-y-4 flex flex-col">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 flex flex-col">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input id="customerName" name="customerName" required className="rounded-xl" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <Label htmlFor="serviceType">Service Type</Label>
                    <Input id="serviceType" name="serviceType" required className="rounded-xl" />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 flex flex-col">
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue="medium" required>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 flex flex-col">
                  <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                  <Input id="estimatedCost" name="estimatedCost" type="number" required className="rounded-xl" />
                </div>
              </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 flex flex-col">
                    <Label htmlFor="scheduledDate">Scheduled Date</Label>
                    <Input id="scheduledDate" name="scheduledDate" type="date" required className="rounded-xl" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <Label htmlFor="scheduledTime">Scheduled Time</Label>
                    <Input id="scheduledTime" name="scheduledTime" type="time" required className="rounded-xl" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" required className="rounded-xl" />
                </div>

                <div className="flex flex-col">
                  <Label htmlFor="description">Description</Label>
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
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completion-requested">Completion Requested</SelectItem>
                    <SelectItem value="rejection-requested">Rejection Requested</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
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
                  <div className={`w-1.5 h-16 rounded-full ${getPriorityColor(order.priority)}`}></div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{order.id}</h3>
                      <Badge className={getStatusColor(order.status)} variant="outline">
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                  </div>
                </div>
                <Badge className={`${getPriorityColor(order.priority)} text-white whitespace-nowrap`}>
                  {order.priority}
                </Badge>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-gray-600">{order.serviceType}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-600">{order.location}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-600">{order.scheduledDate} at {order.scheduledTime}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-gray-600">${order.estimatedCost}</span>
                </div>

                {order.technicianName && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-gray-600">{order.technicianName}</span>
                  </div>
                )}

                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{order.description}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                {order.rawStatus === 'submitted' && (
                  <Button
                    onClick={async () => {
                      await api.approveWorkOrder(order.rawId);
                      await loadData(false);
                      toast.success('Booking approved!');
                    }}
                    className="flex-1 min-w-[130px] rounded-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    Approve
                  </Button>
                )}
                {(order.rawStatus === 'approved' || order.status === 'pending') && (
                  <Button 
                    onClick={() => { setSelectedOrder(order); setIsAssignDialogOpen(true); }}
                    className="flex-1 min-w-[150px] rounded-full bg-blue-600 hover:bg-blue-700"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Assign Technician
                  </Button>
                )}
                {order.status === 'assigned' && (
                  <Button 
                    onClick={() => { setSelectedOrder(order); setIsAssignDialogOpen(true); }}
                    variant="outline"
                    className="flex-1 min-w-[150px] rounded-full"
                  >
                    Reassign
                  </Button>
                )}
                {order.rawStatus === 'completion_requested' && (
                  <Button
                    onClick={async () => {
                      await api.approveCompletionRequest(order.rawId);
                      await loadData(false);
                      toast.success('Completion approved');
                    }}
                    className="flex-1 min-w-[170px] rounded-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    Approve Completion
                  </Button>
                )}
                {order.rawStatus === 'rejection_requested' && (
                  <Button
                    onClick={async () => {
                      await api.approveRejectionRequest(order.rawId);
                      await loadData(false);
                      toast.success('Rejection approved');
                    }}
                    className="flex-1 min-w-[160px] rounded-full bg-orange-600 hover:bg-orange-700"
                  >
                    Approve Rejection
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => { setSelectedOrder(order); setIsDetailsDialogOpen(true); }}
                  className="flex-1 min-w-[120px] rounded-full"
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
          <div className="space-y-3 max-h-96 overflow-y-auto flex flex-col">
            {technicians
              .filter(tech => tech.status !== 'offline')
              .map((tech) => (
                <div
                  key={tech.id}
                  onClick={() => handleAssignTechnician(tech.id)}
                  className="p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 cursor-pointer transition-colors border-2 border-transparent hover:border-blue-500 flex flex-col"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className={`w-12 h-12 ${tech.status === 'available' ? 'bg-green-500' : 'bg-blue-500'} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
                      {tech.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{tech.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge className={tech.status === 'available' ? 'bg-green-500 hover:bg-green-500 text-white' : 'bg-blue-500 hover:bg-blue-500 text-white'} variant="secondary">
                          {tech.status === 'available' ? 'Available' : 'On Job'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {tech.currentJobs} active job{tech.currentJobs !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-green-600">{tech.completionRate}%</p>
                      <p className="text-xs text-gray-500">completion</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tech.specialty.map((spec) => (
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
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Work Order Details {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-gray-500">Customer</p>
                  <p className="font-semibold">{selectedOrder.customerName}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-gray-500">Technician</p>
                  <p className="font-semibold">{selectedOrder.technicianName ?? 'Not assigned yet'}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-gray-500">Service</p>
                  <p className="font-semibold">{selectedOrder.serviceType}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-gray-500">Status</p>
                  <Badge className={getStatusColor(selectedOrder.status)} variant="outline">
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-gray-500">Schedule</p>
                  <p className="font-semibold">{selectedOrder.scheduledDate} at {selectedOrder.scheduledTime}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-gray-500">Package Price</p>
                  <p className="font-semibold">Rs {selectedOrder.estimatedCost}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-gray-500">Address</p>
                <p className="font-semibold">{selectedOrder.location}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-gray-500">Customer Notes</p>
                <p className="font-semibold">{selectedOrder.description || 'No notes added'}</p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" className="rounded-full" onClick={() => setIsDetailsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {filteredOrders.length === 0 && (
        <Card className="rounded-3xl border-none shadow-lg">
          <CardContent className="p-12 flex items-center justify-center">
            <p className="text-gray-500">No work orders found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
