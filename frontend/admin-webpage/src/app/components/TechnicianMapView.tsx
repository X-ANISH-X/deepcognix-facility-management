import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import { getServiceColor } from '@/app/utils/serviceColors';
import { api, type Technician } from '@/app/services/api';
import { MapPin, Phone, Mail, Navigation, User, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export function TechnicianMapView() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTechnicians = async () => {
    setIsLoading(true);
    const data = await api.getTechnicians();
    setTechnicians(data);
    if (data.length > 0 && !selectedTech) setSelectedTech(data[0]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadTechnicians();
  }, []);

  const handleAddTechnician = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const password = fd.get('password') as string;
    const confirm = fd.get('confirm_password') as string;
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createTechnician({
        full_name: fd.get('full_name') as string,
        email: fd.get('email') as string,
        password,
        phone_number: fd.get('phone_number') as string,
      });
      toast.success('Technician account created successfully');
      setIsAddDialogOpen(false);
      form.reset();
      await loadTechnicians();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create technician');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-600';
      case 'on-job': return 'bg-teal-500 hover:bg-teal-500 dark:bg-teal-600 dark:hover:bg-teal-600';
      case 'offline': return 'bg-gray-500 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-600';
      default: return 'bg-gray-500 hover:bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'on-job': return 'On Job';
      case 'offline': return 'Offline';
      default: return status;
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading Technician Tracking..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Technician Tracking</h1>
          <p className="text-gray-500 mt-1">Real-time location and status monitoring</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="rounded-full bg-teal-600 hover:bg-teal-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Technician
        </Button>
      </div>

      {/* Add Technician Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Add New Technician</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTechnician} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" name="full_name" required className="rounded-xl" placeholder="e.g. Rahul Sharma" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required className="rounded-xl" placeholder="rahul@example.com" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input id="phone_number" name="phone_number" className="rounded-xl" placeholder="+91 98765 00000" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={6} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <Input id="confirm_password" name="confirm_password" type="password" required minLength={6} className="rounded-xl" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="flex-1 rounded-full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-full bg-teal-600 hover:bg-teal-700"
              >
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area - Mock Map */}
        <Card className="lg:col-span-2 rounded-3xl border-none shadow-lg overflow-hidden">
          <CardContent className="p-0 relative">
            <div className="h-[600px] bg-gradient-to-br from-gray-100 to-gray-200 relative">
              {/* Mock Map Background with grid */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `
                  linear-gradient(to right, #cbd5e1 1px, transparent 1px),
                  linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}></div>
              
              {/* Map overlay info */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg text-gray-900">
                <p className="text-sm font-semibold">New York City Area</p>
                <p className="text-xs text-gray-500">Live Tracking Enabled</p>
              </div>

              {/* Technician markers on the mock map */}
              {technicians.map((tech, index) => (
                <div
                  key={tech.id}
                  className={`absolute cursor-pointer transition-transform hover:scale-110 ${
                    selectedTech?.id === tech.id ? 'z-20' : 'z-10'
                  }`}
                  style={{
                    left: `${20 + index * 15}%`,
                    top: `${30 + (index % 3) * 20}%`,
                  }}
                  onClick={() => setSelectedTech(tech)}
                >
                  {/* Pulse effect for on-job technicians */}
                  {tech.status === 'on-job' && (
                    <div className="absolute -inset-2 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                  )}
                  
                  {/* Marker */}
                  <div className={`relative w-12 h-12 ${getStatusColor(tech.status)} rounded-full flex items-center justify-center shadow-lg`}>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-700">{tech.avatar}</span>
                    </div>
                  </div>

                  {/* Info popup for selected technician */}
                  {selectedTech?.id === tech.id && (
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 w-64 bg-white rounded-2xl shadow-xl p-4 z-30 text-gray-900">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 ${getStatusColor(tech.status)} rounded-full flex items-center justify-center text-white font-bold`}>
                          {tech.avatar}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{tech.name}</p>
                          <Badge className={`${getStatusColor(tech.status)} text-white text-xs`}>
                            {getStatusText(tech.status)}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="text-xs">{tech.location.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Navigation className="w-4 h-4" />
                          <span className="text-xs">Active Jobs: {tech.currentJobs}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-lg text-gray-900">
                <p className="text-sm font-semibold mb-2">Status Legend</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                    <span className="text-xs">On Job</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-xs">Offline</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technician List */}
        <div className="space-y-4">
          <Card className="rounded-3xl border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Active Technicians</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[560px] overflow-y-auto text-gray-900 dark:text-black">
              {technicians.map((tech) => (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTech(tech)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all ${
                    selectedTech?.id === tech.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 ${getStatusColor(tech.status)} rounded-full flex items-center justify-center text-white font-bold`}>
                      {tech.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{tech.name}</p>
                      <Badge className={`${getStatusColor(tech.status)} text-white text-xs mt-1`}>
                        {getStatusText(tech.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs truncate" title={tech.email}>{tech.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span className="text-xs">{tech.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs truncate" title={tech.location.address}>{tech.location.address}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Active Jobs</span>
                      <span className="font-semibold">{tech.currentJobs}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-gray-600">Completion Rate</span>
                      <span className="font-semibold text-green-600">{tech.completionRate}%</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {tech.specialty.map((spec) => (
                      <Badge key={spec} className={`text-xs ${getServiceColor(spec)}`}>
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-3xl border-none shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {technicians.filter(t => t.status === 'available').length}
                </div>
                <div className="text-sm opacity-90 mt-1">Available</div>
              </div>
              <User className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {technicians.filter(t => t.status === 'on-job').length}
                </div>
                <div className="text-sm opacity-90 mt-1">On Job</div>
              </div>
              <Navigation className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg bg-gradient-to-br from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {technicians.filter(t => t.status === 'offline').length}
                </div>
                <div className="text-sm opacity-90 mt-1">Offline</div>
              </div>
              <User className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {technicians.reduce((sum, t) => sum + t.currentJobs, 0)}
                </div>
                <div className="text-sm opacity-90 mt-1">Total Jobs</div>
              </div>
              <MapPin className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}