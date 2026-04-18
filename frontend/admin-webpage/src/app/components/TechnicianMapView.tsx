import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import { getServiceColor } from '@/app/utils/serviceColors';
import { useLanguage } from '@/app/context/LanguageContext';
import { api as mockApi, type Technician } from '@/app/services/api';
import { MapPin, Phone, Mail, Navigation, User, Search } from 'lucide-react';
import { toast } from 'sonner';

export function TechnicianMapView() {
  const { t } = useLanguage();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [techSearch, setTechSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadTechnicians = async (showLoader = false, silent = true) => {
    if (showLoader) {
      setIsLoading(true);
    }
    try {
      const data = await mockApi.getTechnicians();
      setTechnicians(data);
      setSelectedTech((current) => {
        if (!data.length) return null;
        if (!current) return data[0];
        return data.find((item) => item.id === current.id) || data[0];
      });
    } catch (error) {
      if (!silent) {
        const message = error instanceof Error ? error.message : 'Failed to load technicians';
        toast.error(message);
      }
      setTechnicians([]);
      setSelectedTech(null);
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadTechnicians(true, false);

    const unsubscribe = mockApi.subscribeRealtime((event) => {
      const eventName = event.event;
      if (eventName === 'technician.location_updated' || eventName === 'technician.status_updated') {
        void loadTechnicians(false, true);
      }
    });

    const pollTimer = window.setInterval(() => {
      void loadTechnicians(false, true);
    }, 8000);

    return () => {
      unsubscribe();
      window.clearInterval(pollTimer);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-600';
      case 'assigned': return 'bg-violet-500 hover:bg-violet-500 dark:bg-violet-600 dark:hover:bg-violet-600';
      case 'enroute': return 'bg-amber-500 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-600';
      case 'onsite': return 'bg-teal-500 hover:bg-teal-500 dark:bg-teal-600 dark:hover:bg-teal-600';
      case 'offline': return 'bg-gray-500 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-600';
      default: return 'bg-gray-500 hover:bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return t('technician.status.available');
      case 'assigned': return t('technician.status.assigned');
      case 'enroute': return t('technician.status.enroute');
      case 'onsite': return t('technician.status.onsite');
      case 'offline': return t('technician.status.offline');
      default: return status;
    }
  };

  const filteredTechnicians = technicians.filter((tech) => {
    const query = techSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }

    const haystack = [
      tech.name,
      tech.email,
      tech.phone,
      tech.status,
      tech.location.address,
      ...tech.specialty,
      tech.currentJobs > 0 ? 'assigned' : 'unassigned',
    ].join(' ').toLowerCase();

    return haystack.includes(query);
  });

  const positionedTechnicians = useMemo(() => {
    const hasValidCoordinate = (tech: Technician) => {
      const { lat, lng } = tech.location;
      return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
    };

    const coordinateTechnicians = filteredTechnicians.filter(hasValidCoordinate);
    const latitudes = coordinateTechnicians.map((tech) => tech.location.lat);
    const longitudes = coordinateTechnicians.map((tech) => tech.location.lng);
    const minLat = latitudes.length ? Math.min(...latitudes) : 0;
    const maxLat = latitudes.length ? Math.max(...latitudes) : 0;
    const minLng = longitudes.length ? Math.min(...longitudes) : 0;
    const maxLng = longitudes.length ? Math.max(...longitudes) : 0;
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;

    return filteredTechnicians.map((tech, index) => {
      if (!hasValidCoordinate(tech)) {
        return {
          tech,
          left: `${20 + index * 15}%`,
          top: `${30 + (index % 3) * 20}%`,
          usesLivePosition: false,
        };
      }

      const xRaw = lngRange > 0 ? (tech.location.lng - minLng) / lngRange : 0.5;
      const yRaw = latRange > 0 ? (tech.location.lat - minLat) / latRange : 0.5;
      const x = 10 + xRaw * 80;
      const y = 10 + (1 - yRaw) * 80;

      return {
        tech,
        left: `${x}%`,
        top: `${y}%`,
        usesLivePosition: true,
      };
    });
  }, [filteredTechnicians]);

  if (isLoading) {
    return <LoadingSpinner message={t('technician.loading')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('technician.title')}</h1>
        <p className="text-gray-500 mt-1">{t('technician.subtitle')}</p>
      </div>

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
                <p className="text-sm font-semibold">
                  {selectedTech?.location.address && selectedTech.location.address !== 'N/A'
                    ? selectedTech.location.address
                    : t('technician.map.area')}
                </p>
                <p className="text-xs text-gray-500">
                  {positionedTechnicians.some((item) => item.usesLivePosition)
                    ? 'Live GPS marker positions'
                    : t('technician.map.live')}
                </p>
              </div>

              {/* Technician markers on the mock map */}
              {positionedTechnicians.map(({ tech, left, top }) => (
                <div
                  key={tech.id}
                  className={`absolute cursor-pointer transition-transform hover:scale-110 ${
                    selectedTech?.id === tech.id ? 'z-20' : 'z-10'
                  }`}
                  style={{
                    left,
                    top,
                  }}
                  onClick={() => setSelectedTech(tech)}
                >
                  {/* Pulse effect for active route/onsite technicians */}
                  {(tech.status === 'enroute' || tech.status === 'onsite') && (
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
                          <span className="text-xs">{t('technician.activeJobs')}: {tech.currentJobs}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-lg text-gray-900">
                <p className="text-sm font-semibold mb-2">{t('technician.legend.title')}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs">{t('technician.status.available')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                    <span className="text-xs">{t('technician.status.assigned')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-xs">{t('technician.status.enroute')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                    <span className="text-xs">{t('technician.status.onsite')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-xs">{t('technician.status.offline')}</span>
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
              <CardTitle className="text-gray-900 dark:text-white">{t('technician.activeTechnicians')}</CardTitle>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={techSearch}
                  onChange={(event) => setTechSearch(event.target.value)}
                  placeholder="Search by name, status, assigned work, specialty..."
                  className="pl-9 rounded-xl"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[560px] overflow-y-auto text-gray-900 dark:text-black">
              {filteredTechnicians.map((tech) => (
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
                      <span className="text-gray-600">{t('technician.activeJobs')}</span>
                      <span className="font-semibold">{tech.currentJobs}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-gray-600">{t('technician.completionRate')}</span>
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
                  {filteredTechnicians.filter(t => t.status === 'available').length}
                </div>
                <div className="text-sm opacity-90 mt-1">{t('technician.status.available')}</div>
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
                  {filteredTechnicians.filter(t => t.status === 'assigned').length}
                </div>
                <div className="text-sm opacity-90 mt-1">{t('technician.status.assigned')}</div>
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
                  {filteredTechnicians.filter(t => t.status === 'offline').length}
                </div>
                <div className="text-sm opacity-90 mt-1">{t('technician.status.offline')}</div>
              </div>
              <User className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg bg-gradient-to-br from-cyan-500 to-cyan-600 dark:from-cyan-600 dark:to-cyan-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {filteredTechnicians.filter(t => t.status === 'onsite').length}
                </div>
                <div className="text-sm opacity-90 mt-1">{t('technician.status.onsite')}</div>
              </div>
              <MapPin className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}