import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import { api as mockApi, type Technician, type WorkOrder } from '@/app/services/api';
import { toast } from 'sonner';

type EditableProfile = {
  fullName: string;
  email: string;
  phone: string;
  status: Technician['status'];
};

function statusBadgeClass(status: Technician['status']): string {
  if (status === 'available') return 'bg-emerald-500 text-white';
  if (status === 'assigned') return 'bg-violet-500 text-white';
  if (status === 'enroute') return 'bg-amber-500 text-white';
  if (status === 'onsite') return 'bg-teal-700 text-white';
  return 'bg-slate-500 text-white';
}

function statusLabel(status: Technician['status']): string {
  if (status === 'enroute') return 'En Route';
  if (status === 'onsite') return 'On Site';
  return status[0].toUpperCase() + status.slice(1);
}

function getRegistryStatus(technician: Technician): Technician['status'] {
  if (technician.status === 'available' && technician.currentJobs > 0) {
    return 'assigned';
  }

  return technician.status;
}

function normalizeOrderStatus(status: string): string {
  switch (status) {
    case 'approved':
      return 'submitted';
    case 'in_progress':
      return 'in-progress';
    default:
      return status;
  }
}

function getOrderStatusBadgeClass(status: string): string {
  switch (normalizeOrderStatus(status)) {
    case 'completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200';
    case 'in-progress':
      return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200';
    case 'submitted':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200';
    case 'assigned':
      return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-200';
    case 'admin_review_pending':
      return 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-200';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';
  }
}

function getOrderStatusLabel(status: string): string {
  switch (normalizeOrderStatus(status)) {
    case 'submitted':
      return 'Submitted';
    case 'assigned':
      return 'Assigned';
    case 'in-progress':
      return 'In Progress';
    case 'admin_review_pending':
      return 'Completion Requested';
    case 'completed':
      return 'Completed';
    default:
      return status
        .split(/[-_]/)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(' ');
  }
}

const registrationInputClass =
  'rounded-xl border-slate-400 bg-slate-100 text-slate-900 placeholder:text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:shadow-none';

const profileInputClass = registrationInputClass;

const profileSelectClass =
  'rounded-xl border border-slate-400 bg-slate-100 px-3 text-sm text-slate-900 outline-none shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none';

const profileSelectContentClass =
  'rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950';

const registrySearchClass =
  'mt-3 rounded-xl border-slate-400 bg-slate-100 text-slate-900 placeholder:text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:shadow-none';

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export function TechnicianManagement() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [profile, setProfile] = useState<EditableProfile>({
    fullName: '',
    email: '',
    phone: '',
    status: 'available',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [nextTechnicians, nextOrders] = await Promise.all([
        mockApi.getTechnicians(),
        mockApi.getWorkOrders(),
      ]);
      setTechnicians(nextTechnicians);
      setOrders(nextOrders.filter((order) => !['rejection-requested', 'rejected'].includes(order.status)));
      setSelectedId((current) => current || nextTechnicians[0]?.id || '');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load technician registry';
      toast.error(message);
      setTechnicians([]);
      setOrders([]);
      setSelectedId('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredTechnicians = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return technicians;

    return technicians.filter((tech) => {
      return [tech.name, tech.email, tech.phone, tech.status, tech.location.address]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [search, technicians]);

  const selectedTechnician = useMemo(
    () => technicians.find((item) => item.id === selectedId) || filteredTechnicians[0] || null,
    [filteredTechnicians, selectedId, technicians],
  );

  useEffect(() => {
    if (!selectedTechnician) {
      setProfile({ fullName: '', email: '', phone: '', status: 'available' });
      return;
    }

    setProfile({
      fullName: selectedTechnician.name,
      email: selectedTechnician.email,
      phone: selectedTechnician.phone,
      status: selectedTechnician.status,
    });
  }, [selectedTechnician]);

  const selectedOrders = useMemo(() => {
    if (!selectedTechnician) return [];
    return orders
      .filter((order) => order.technicianId === selectedTechnician.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, selectedTechnician]);

  const completedCount = useMemo(
    () => selectedOrders.filter((order) => order.status === 'completed').length,
    [selectedOrders],
  );

  useEffect(() => {
    if (!isOrderDialogOpen) {
      setSelectedOrder(null);
    }
  }, [isOrderDialogOpen]);

  const saveProfile = async () => {
    if (!selectedTechnician) return;

    if (!profile.fullName.trim() || !profile.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    setSaving(true);
    try {
      const updated = await mockApi.updateTechnicianProfile(selectedTechnician.id, {
        fullName: profile.fullName.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        status: profile.status,
      });

      setTechnicians((current) => current.map((tech) => (tech.id === updated.id ? updated : tech)));
      toast.success('Technician profile updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update technician profile';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const resetRegistrationForm = () => {
    setRegistrationForm({
      fullName: '',
      email: '',
      phone: '',
      password: '',
    });
  };

  const registerTechnician = async () => {
    const fullName = registrationForm.fullName.trim();
    const email = registrationForm.email.trim();
    const phone = registrationForm.phone.trim();
    const password = registrationForm.password;

    if (!fullName || !email) {
      toast.error('Full name and email are required');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setRegistering(true);
    try {
      const created = await mockApi.createTechnician({
        fullName,
        email,
        phone: phone || undefined,
        password,
      });

      setTechnicians((current) => [created, ...current.filter((tech) => tech.id !== created.id)]);
      setSelectedId(created.id);
      setSearch('');
      resetRegistrationForm();
      toast.success(`Technician ${created.name} registered successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register technician';
      toast.error(message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading technician registry..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Technician Registry & Management</h1>
        <p className="mt-1 text-gray-500">Manage technicians, edit profile details, and track worked orders.</p>
      </div>

      <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950 dark:text-white">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/90 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800 dark:bg-slate-900/50">
          <div>
            <CardTitle className="dark:text-white">Register New Technician</CardTitle>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              Create a technician account directly from the admin dashboard.
            </p>
          </div>
          <Badge className="w-fit bg-slate-900 text-white dark:bg-white/10 dark:text-white">Backend connected</Badge>
        </CardHeader>
        <CardContent className="pt-6">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void registerTechnician();
            }}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Input
                value={registrationForm.fullName}
                onChange={(event) => setRegistrationForm((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Full name"
                className={registrationInputClass}
                disabled={registering}
              />
              <Input
                value={registrationForm.email}
                onChange={(event) => setRegistrationForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email address"
                className={registrationInputClass}
                disabled={registering}
              />
              <Input
                value={registrationForm.phone}
                onChange={(event) => setRegistrationForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Phone number"
                className={registrationInputClass}
                disabled={registering}
              />
              <Input
                value={registrationForm.password}
                onChange={(event) => setRegistrationForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Initial password"
                type="password"
                className={registrationInputClass}
                disabled={registering}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={registering} className="rounded-xl">
                {registering ? 'Registering...' : 'Register Technician'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetRegistrationForm}
                disabled={registering}
                className="rounded-xl"
              >
                Clear Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-none shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle>Technicians</CardTitle>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, status"
              className={registrySearchClass}
            />
          </CardHeader>
          <CardContent className="max-h-144 space-y-3 overflow-y-auto">
            {filteredTechnicians.length ? filteredTechnicians.map((tech) => (
              <button
                key={tech.id}
                type="button"
                onClick={() => setSelectedId(tech.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${selectedTechnician?.id === tech.id ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 font-semibold text-slate-900 wrap-break-word">{tech.name}</p>
                  <Badge className={statusBadgeClass(getRegistryStatus(tech))}>{statusLabel(getRegistryStatus(tech))}</Badge>
                </div>
                <p className="min-w-0 break-all text-xs text-slate-500">{tech.email}</p>
                <p className="mt-1 wrap-break-word text-xs text-slate-500">{tech.location.address}</p>
              </button>
            )) : (
              <p className="text-sm text-slate-500">No technicians matched your search.</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:col-span-2 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/50">
            <div>
              <CardTitle className="dark:text-white">Technician Profile</CardTitle>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                Update the selected technician details and review their recent work orders.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {selectedTechnician ? (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    value={profile.fullName}
                    onChange={(event) => setProfile((prev) => ({ ...prev, fullName: event.target.value }))}
                    placeholder="Full name"
                    className={profileInputClass}
                  />
                  <Input
                    value={profile.email}
                    onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="Email"
                    className={profileInputClass}
                  />
                  <Input
                    value={profile.phone}
                    onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder="Phone number"
                    className={profileInputClass}
                  />
                  <Select
                    value={profile.status}
                    onValueChange={(value) => setProfile((prev) => ({ ...prev, status: value as Technician['status'] }))}
                  >
                    <SelectTrigger className={profileSelectClass}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className={profileSelectContentClass}>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="enroute">En Route</SelectItem>
                      <SelectItem value="onsite">On Site</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={() => void saveProfile()} disabled={saving} className="rounded-xl">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void load()}
                    className="rounded-xl"
                  >
                    Refresh Registry
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-100/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Worked Orders</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedOrders.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-100/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Completed Orders</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{completedCount}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-100/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Current Active Jobs</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedTechnician.currentJobs}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Order History</h3>
                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {selectedOrders.length ? selectedOrders.map((order) => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsOrderDialogOpen(true);
                        }}
                            className={`w-full rounded-xl border border-slate-200 border-l-4 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-slate-700 dark:hover:bg-slate-900 ${getOrderStatusBadgeClass(order.status)}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Order #{order.id}</p>
                              <Badge className={getOrderStatusBadgeClass(order.status)}>{getOrderStatusLabel(order.status)}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{order.customerName} · {order.serviceType}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{order.location}</p>
                      </button>
                    )) : (
                      <p className="text-sm text-slate-500">No worked orders found for this technician.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Select a technician from the left to manage profile and order history.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-3xl rounded-3xl border border-slate-200 bg-white max-h-[90vh] overflow-y-auto dark:border-slate-800 dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Order Details</DialogTitle>
          </DialogHeader>

          {selectedOrder ? (
            <div className="space-y-6 text-slate-900 dark:text-slate-100">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Booking</p>
                  <h3 className="text-2xl font-bold">Order #{selectedOrder.id}</h3>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">{selectedOrder.customerName}</p>
                </div>
                <Badge className={getOrderStatusBadgeClass(selectedOrder.status)}>{getOrderStatusLabel(selectedOrder.status)}</Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailRow label="Service" value={selectedOrder.serviceType} />
                <DetailRow label="Estimated Cost" value={`$${selectedOrder.estimatedCost.toFixed(2)}`} />
                <DetailRow label="Schedule" value={`${selectedOrder.scheduledDate} at ${selectedOrder.scheduledTime}`} />
                <DetailRow label="Location" value={selectedOrder.location} />
                <DetailRow label="Technician" value={selectedTechnician?.name || 'Not assigned'} />
                <DetailRow label="Created At" value={formatDateTime(selectedOrder.createdAt)} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Description</span>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-100">
                    {selectedOrder.description || 'No description provided.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Customer Notes</span>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-100">
                    {selectedOrder.customerNotes || 'No customer notes provided.'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Technician Comments</span>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-100">
                  {selectedOrder.technicianNotes || 'No technician comments were saved for this order.'}
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" className="rounded-full" onClick={() => setIsOrderDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
