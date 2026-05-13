import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
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

export function TechnicianManagement() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      setOrders(nextOrders);
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

  if (loading) {
    return <LoadingSpinner message="Loading technician registry..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Technician Registry & Management </h1>
        <p className="mt-1 text-gray-500">Manage technicians, edit profile details, and track worked orders.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-none shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle>Technicians</CardTitle>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, status"
              className="mt-3 rounded-xl"
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
                  <p className="min-w-0 flex-1 font-semibold text-slate-900 break-words">{tech.name}</p>
                  <Badge className={statusBadgeClass(tech.status)}>{statusLabel(tech.status)}</Badge>
                </div>
                <p className="min-w-0 break-all text-xs text-slate-500">{tech.email}</p>
                <p className="mt-1 break-words text-xs text-slate-500">{tech.location.address}</p>
              </button>
            )) : (
              <p className="text-sm text-slate-500">No technicians matched your search.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle>Technician Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedTechnician ? (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    value={profile.fullName}
                    onChange={(event) => setProfile((prev) => ({ ...prev, fullName: event.target.value }))}
                    placeholder="Full name"
                    className="rounded-xl border-slate-300 bg-slate-100 text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
                  />
                  <Input
                    value={profile.email}
                    onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="Email"
                    className="rounded-xl border-slate-300 bg-slate-100 text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
                  />
                  <Input
                    value={profile.phone}
                    onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder="Phone number"
                    className="rounded-xl border-slate-300 bg-slate-100 text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
                  />
                  <select
                    value={profile.status}
                    onChange={(event) => setProfile((prev) => ({ ...prev, status: event.target.value as Technician['status'] }))}
                    className="h-10 rounded-xl border border-slate-300 bg-slate-100 px-3 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="enroute">En Route</option>
                    <option value="onsite">On Site</option>
                    <option value="offline">Offline</option>
                  </select>
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
                  <div className="rounded-2xl border bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Worked Orders</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{selectedOrders.length}</p>
                  </div>
                  <div className="rounded-2xl border bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Completed Orders</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{completedCount}</p>
                  </div>
                  <div className="rounded-2xl border bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Current Active Jobs</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{selectedTechnician.currentJobs}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Order History</h3>
                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {selectedOrders.length ? selectedOrders.map((order) => (
                      <div key={order.id} className="rounded-xl border bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">Order #{order.id}</p>
                          <Badge className="bg-slate-800 text-white">{order.status}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">{order.customerName} · {order.serviceType}</p>
                        <p className="text-xs text-slate-500">{order.location}</p>
                      </div>
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
    </div>
  );
}
