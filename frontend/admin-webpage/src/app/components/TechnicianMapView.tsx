import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import { getServiceColor } from '@/app/utils/serviceColors';
import { useLanguage } from '@/app/context/LanguageContext';
import { api as mockApi, type Technician, type WorkOrder } from '@/app/services/api';
import { MapPin, Phone, Mail, Navigation, User, Search } from 'lucide-react';
import { toast } from 'sonner';
import React from 'react';

export function TechnicianMapView() {
  const { t } = useLanguage();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [techSearch, setTechSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMapActive, setIsMapActive] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [mapTransitionMs, setMapTransitionMs] = useState(120);
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapContentRef = React.useRef<HTMLDivElement>(null);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [viewingDestination, setViewingDestination] = useState(false);
  const [workOrderNotesById, setWorkOrderNotesById] = useState<Record<string, WorkOrder>>({});
  const [newTechForm, setNewTechForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  const loadTechnicians = async (showLoader = false, silent = true) => {
    if (showLoader) {
      setIsLoading(true);
    }
    try {
      const data = await mockApi.getTechnicians();
      const workOrders = await mockApi.getWorkOrders();
      const byId = workOrders.reduce<Record<string, WorkOrder>>((acc, order) => {
        acc[String(order.id)] = order;
        return acc;
      }, {});
      setWorkOrderNotesById(byId);
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
      if (
        eventName === 'technician.location_updated'
        || eventName === 'technician.status_updated'
        || eventName === 'technician.updated'
      ) {
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

  useEffect(() => {
    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (!mapRef.current?.contains(event.target as Node)) {
        setIsMapActive(false);
        setIsDragging(false);
      }
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown);
    return () => document.removeEventListener('pointerdown', handleDocumentPointerDown);
  }, []);

  const handleMapWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!isMapActive || (!e.ctrlKey && !e.metaKey)) return;
    e.preventDefault();
    e.stopPropagation();
    setMapTransitionMs(120);
    const zoomSpeed = 0.1;
    const nextZoom = e.deltaY > 0
      ? Math.max(0.5, mapZoom - zoomSpeed)
      : Math.min(3, mapZoom + zoomSpeed);

    if (mapRef.current) {
      const bounds = mapRef.current.getBoundingClientRect();
      const cursorX = e.clientX - bounds.left;
      const cursorY = e.clientY - bounds.top;
      const contentX = (cursorX - mapPan.x) / mapZoom;
      const contentY = (cursorY - mapPan.y) / mapZoom;

      setMapPan({
        x: cursorX - contentX * nextZoom,
        y: cursorY - contentY * nextZoom,
      });
    }

    setMapZoom(nextZoom);
  };

  const handleMapMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsMapActive(true);
    setIsDragging(true);
    setMapTransitionMs(120);
    setDragStart({ x: e.clientX - mapPan.x, y: e.clientY - mapPan.y });
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !isMapActive) return;
    setMapPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMapMouseUp = () => {
    setIsDragging(false);
  };

  const centerMapOnMarker = (markerLeft: string, markerTop: string) => {
    if (!mapRef.current || !mapContentRef.current) return;

    const mapRect = mapRef.current.getBoundingClientRect();
    const markerPercentX = parseFloat(markerLeft);
    const markerPercentY = parseFloat(markerTop);
    const mapWidth = mapContentRef.current.offsetWidth;
    const mapHeight = mapContentRef.current.offsetHeight;
    const markerPixelX = (mapWidth * markerPercentX) / 100;
    const markerPixelY = (mapHeight * markerPercentY) / 100;
    const centerX = (mapRect.width / mapZoom) / 2;
    const centerY = (mapRect.height / mapZoom) / 2;

    setMapPan({
      x: centerX - markerPixelX,
      y: centerY - markerPixelY,
    });
  };

  const handleTechnicianSelect = (tech: Technician) => {
    setSelectedTech(tech);
    setViewingDestination(false);
    setMapTransitionMs(1100);
    const marker = positionedMarkers.find(m => m.tech.id === tech.id && m.kind === 'live');
    if (marker) {
      centerMapOnMarker(marker.left as string, marker.top as string);
    }
  };

  const handleZoomMap = (direction: 'in' | 'out') => {
    setIsMapActive(true);
    setIsDragging(false);
    setMapTransitionMs(260);
    const nextZoom = direction === 'in'
      ? Math.min(3, mapZoom + 0.2)
      : Math.max(0.5, mapZoom - 0.2);
    setMapZoom(nextZoom);
  };

  const handleResetMap = () => {
    setSelectedTech(null);
    setHoveredMarkerId(null);
    setMapTransitionMs(260);
    setMapZoom(1);
    setMapPan({ x: 0, y: 0 });
  };

  const centerMapOnDestination = () => {
    if (!selectedTech?.bookingLocation) return;
    const bookingMarker = positionedMarkers.find((marker) => marker.tech.id === selectedTech.id && marker.kind === 'booking');
    if (!bookingMarker) return;
    setViewingDestination(true);
    setMapTransitionMs(1100);
    centerMapOnMarker(bookingMarker.left as string, bookingMarker.top as string);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-600';
      case 'assigned': return 'bg-violet-500 hover:bg-violet-500 dark:bg-violet-600 dark:hover:bg-violet-600';
      case 'enroute': return 'bg-amber-500 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-600';
      case 'onsite': return 'bg-teal-700 hover:bg-teal-700 dark:bg-teal-800 dark:hover:bg-teal-800';
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
      tech.bookingLocation?.address,
      tech.locationSource,
      ...tech.specialty,
      tech.currentJobs > 0 ? 'assigned' : 'unassigned',
    ].join(' ').toLowerCase();

    return haystack.includes(query);
  });

  const positionedMarkers = useMemo(() => {
    const hasValidCoordinate = (lat?: number, lng?: number) => {
      return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
    };

    const markers = filteredTechnicians.flatMap((tech, index) => {
      const liveLocation = tech.liveLocation;
      const bookingLocation = tech.bookingLocation;
      const liveValid = hasValidCoordinate(liveLocation?.lat, liveLocation?.lng);
      const bookingValid = hasValidCoordinate(bookingLocation?.lat, bookingLocation?.lng);
      const sameAsLive =
        liveValid &&
        bookingValid &&
        liveLocation &&
        bookingLocation &&
        Math.abs(liveLocation.lat - bookingLocation.lat) < 0.000001 &&
        Math.abs(liveLocation.lng - bookingLocation.lng) < 0.000001;

      const output: Array<{
        tech: Technician;
        kind: 'live' | 'booking' | 'fallback';
        lat: number;
        lng: number;
        label: string;
        address: string;
        fallbackIndex: number;
        offsetX: number;
        offsetY: number;
        usesLivePosition: boolean;
      }> = [];

      if (liveValid && liveLocation) {
        output.push({
          tech,
          kind: 'live',
          lat: liveLocation.lat,
          lng: liveLocation.lng,
          label: 'Live device location',
          address: 'Live GPS signal',
          fallbackIndex: index,
          offsetX: 0,
          offsetY: 0,
          usesLivePosition: true,
        });
      }

      if (bookingValid && bookingLocation) {
        output.push({
          tech,
          kind: 'booking',
          lat: bookingLocation.lat,
          lng: bookingLocation.lng,
          label: `Order #${bookingLocation.orderId || tech.id}${sameAsLive ? ' (reached)' : ''}`,
          address: bookingLocation.address,
          fallbackIndex: index,
          offsetX: sameAsLive ? 1.5 : 0,
          offsetY: sameAsLive ? 1.5 : 0,
          usesLivePosition: false,
        });
      }

      if (!output.length && hasValidCoordinate(tech.location.lat, tech.location.lng)) {
        output.push({
          tech,
          kind: 'fallback',
          lat: tech.location.lat,
          lng: tech.location.lng,
          label: tech.locationSource === 'booking' ? 'Booking destination' : 'Live device location',
          address: tech.location.address,
          fallbackIndex: index,
          offsetX: 0,
          offsetY: 0,
          usesLivePosition: tech.locationSource === 'live',
        });
      }

      return output;
    });

    const coordinateMarkers = markers.filter((marker) => hasValidCoordinate(marker.lat, marker.lng));
    const latitudes = coordinateMarkers.map((marker) => marker.lat);
    const longitudes = coordinateMarkers.map((marker) => marker.lng);
    const minLat = latitudes.length ? Math.min(...latitudes) : 0;
    const maxLat = latitudes.length ? Math.max(...latitudes) : 0;
    const minLng = longitudes.length ? Math.min(...longitudes) : 0;
    const maxLng = longitudes.length ? Math.max(...longitudes) : 0;
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;

    return markers.map((marker) => {
      if (!hasValidCoordinate(marker.lat, marker.lng)) {
        return {
          ...marker,
          left: `${20 + marker.fallbackIndex * 15}%`,
          top: `${30 + (marker.fallbackIndex % 3) * 20}%`,
        };
      }

      const xRaw = lngRange > 0 ? (marker.lng - minLng) / lngRange : 0.5;
      const yRaw = latRange > 0 ? (marker.lat - minLat) / latRange : 0.5;
      const x = 10 + xRaw * 80 + marker.offsetX;
      const y = 10 + (1 - yRaw) * 80 + marker.offsetY;

      return {
        ...marker,
        left: `${x}%`,
        top: `${y}%`,
      };
    });
  }, [filteredTechnicians]);

  const handleCreateTechnician = async () => {
    setIsCreating(true);
    try {
      const created = await mockApi.createTechnician({
        fullName: newTechForm.fullName.trim(),
        email: newTechForm.email.trim(),
        phone: newTechForm.phone.trim(),
        password: newTechForm.password,
      });

      toast.success(`Technician added: ${created.name}`);
      setNewTechForm({ fullName: '', email: '', phone: '', password: '' });
      await loadTechnicians(false, true);
      setSelectedTech(created);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add technician';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeactivateSelectedTechnician = async () => {
    if (!selectedTech) {
      toast.error('Select a technician first');
      return;
    }

    const approved = window.confirm(`Deactivate technician ${selectedTech.name}?`);
    if (!approved) {
      return;
    }

    setIsRemoving(true);
    try {
      await mockApi.removeTechnician(selectedTech.id);
      toast.success(`Technician removed: ${selectedTech.name}`);
      await loadTechnicians(false, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove technician';
      toast.error(message);
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message={t('technician.loading')} />;
  }

  const handleMapBackgroundClick = () => {
    setSelectedTech(null);
    setHoveredMarkerId(null);
    setViewingDestination(false);
  };

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
            <div
              ref={mapRef}
              className="h-150 bg-linear-to-br from-gray-100 to-gray-200 relative overflow-hidden cursor-grab active:cursor-grabbing"
              onWheel={handleMapWheel}
              onMouseDown={handleMapMouseDown}
              onMouseMove={handleMapMouseMove}
              onMouseUp={handleMapMouseUp}
              onMouseLeave={handleMapMouseUp}
              onClick={handleMapBackgroundClick}
            >
              <div
                ref={mapContentRef}
                className="absolute inset-0"
                style={{
                  transform: `translate(${mapPan.x}px, ${mapPan.y}px) scale(${mapZoom})`,
                  transformOrigin: '0 0',
                  transition: isDragging ? 'none' : `transform ${mapTransitionMs}ms ease-out`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #cbd5e1 1px, transparent 1px),
                      linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                  }}
                />

                {positionedMarkers.map(({ tech, kind, left, top, label, address }) => (
                  <div
                    key={`${tech.id}-${kind}`}
                    className={`absolute cursor-pointer transition-transform hover:scale-110 ${
                      selectedTech?.id === tech.id ? 'z-20' : 'z-10'
                    }`}
                    style={{ left, top }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedTech(tech);
                      setViewingDestination(kind === 'booking');
                      setMapTransitionMs(1100);
                      centerMapOnMarker(left as string, top as string);
                    }}
                  >
                    {kind === 'booking' && hoveredMarkerId === `${tech.id}-${kind}` && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-md text-white bg-gray-800">
                        {label}
                      </div>
                    )}

                    {kind === 'booking' ? (
                      <div
                        className={`relative flex items-center justify-center rounded-full shadow-lg border-2 border-white transition-transform transform ${selectedTech?.id === tech.id ? 'scale-110 w-10 h-10' : 'w-7 h-7 hover:scale-110'}`}
                        onMouseEnter={() => setHoveredMarkerId(`${tech.id}-${kind}`)}
                        onMouseLeave={() => setHoveredMarkerId(null)}
                      >
                        <div className={`${getStatusColor(tech.status)} rounded-full w-full h-full flex items-center justify-center`}>
                          <div className="text-[10px] font-bold text-white select-none">{tech.avatar}</div>
                        </div>
                      </div>
                    ) : (
                      <div className={`relative w-12 h-12 ${getStatusColor(tech.status)} rounded-full flex items-center justify-center shadow-lg`}>
                        {kind === 'live' && tech.liveLocation && (
                          <div className="absolute -inset-2 rounded-full bg-blue-400/25 animate-ping" />
                        )}
                        {kind === 'fallback' && tech.status !== 'offline' && (
                          <div className="absolute -inset-2 rounded-full bg-gray-400/20 animate-pulse" />
                        )}
                        <div className="relative w-10 h-10 rounded-full flex items-center justify-center bg-white/90 border border-white/80">
                          <span className="text-sm font-bold text-gray-800">{tech.avatar}</span>
                        </div>
                      </div>
                    )}

                    {selectedTech?.id === tech.id && kind === 'live' && !viewingDestination && (
                      <div className="absolute top-14 left-1/2 -translate-x-1/2 w-80 bg-white rounded-2xl shadow-xl p-4 z-30 text-gray-900 pointer-events-auto">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-10 h-10 ${getStatusColor(tech.status)} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
                            {tech.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold">{tech.name}</p>
                            <Badge className={`${getStatusColor(tech.status)} text-white text-xs`}>
                              {getStatusText(tech.status)}
                            </Badge>
                          </div>
                          {tech.bookingLocation && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                centerMapOnDestination();
                              }}
                              className="p-2 rounded-lg hover:bg-blue-50 transition-colors shrink-0 text-blue-600 hover:text-blue-700"
                              title="View destination"
                            >
                              <Navigation className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="text-xs">{address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Navigation className="w-4 h-4 shrink-0" />
                            <span className="text-xs">{t('technician.activeJobs')}: {tech.currentJobs}</span>
                          </div>
                          {tech.bookingLocation && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4 shrink-0" />
                              <span className="text-xs truncate">Destination: {tech.bookingLocation.address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-xs font-medium uppercase tracking-wide">
                              {tech.locationSource === 'live'
                                ? 'Live device location'
                                : tech.locationSource === 'booking'
                                  ? 'Booking destination'
                                  : 'Fallback location'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTech?.id === tech.id && kind === 'booking' && viewingDestination && tech.bookingLocation && (
                      <div className="absolute top-14 left-1/2 -translate-x-1/2 w-80 bg-white rounded-2xl shadow-xl p-4 z-30 text-gray-900 pointer-events-auto">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            📍
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="font-semibold">Order #{tech.bookingLocation.orderId || 'Unavailable'}</p>
                              <p className="text-xs text-gray-500">{tech.name}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setViewingDestination(false);
                              setMapTransitionMs(1100);
                              handleTechnicianSelect(tech);
                            }}
                            className="p-2 rounded-lg hover:bg-blue-50 transition-colors shrink-0 text-blue-600 hover:text-blue-700"
                            title="Back to technician"
                          >
                            <User className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="text-xs font-medium">{tech.bookingLocation.address}</span>
                          </div>
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Location Details</p>
                            <p className="text-xs text-gray-600">Latitude: {tech.bookingLocation.lat.toFixed(4)}</p>
                            <p className="text-xs text-gray-600">Longitude: {tech.bookingLocation.lng.toFixed(4)}</p>
                          </div>
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Customer Notes</p>
                            <p className="text-xs text-gray-600">
                              {workOrderNotesById[String(tech.bookingLocation.orderId || '')]?.customerNotes || 'No customer notes'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-2xl px-3 py-2 shadow-lg text-gray-900 pointer-events-none z-20 max-w-[48%] border border-white/70">
                <p className="text-sm font-semibold truncate">
                  {selectedTech?.location?.address && selectedTech.location.address !== 'N/A'
                    ? selectedTech.location.address
                    : t('technician.map.area')}
                </p>
                <p className="text-xs text-gray-500">Zoom: {mapZoom.toFixed(1)}x | Scroll to zoom • Drag to pan</p>
              </div>



              <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleZoomMap('in');
                  }}
                  className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-white/70 text-gray-900 font-semibold hover:bg-white"
                  aria-label="Zoom in"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleZoomMap('out');
                  }}
                  className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-white/70 text-gray-900 font-semibold hover:bg-white"
                  aria-label="Zoom out"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleResetMap();
                  }}
                  className="px-3 h-10 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-white/70 text-gray-900 text-xs font-semibold hover:bg-white"
                  aria-label="Reset map view"
                >
                  Reset
                </button>
              </div>

              <div className="absolute bottom-3 right-3 z-30">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-lg text-gray-900 w-40 border border-white/70">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{t('technician.legend.title')}</p>
                    <button
                      type="button"
                      onClick={() => setLegendCollapsed((s) => !s)}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm"
                      aria-label={legendCollapsed ? 'Expand legend' : 'Collapse legend'}
                    >
                      {legendCollapsed ? '+' : '−'}
                    </button>
                  </div>
                  {!legendCollapsed && (
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs">Live location pulse</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span className="text-xs">Online, not sharing live location</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                        <span className="text-xs">Booking destination (Tech initials, hover for Order ID)</span>
                      </div>
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
                  )}
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
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTechSearch(event.target.value)}
                  placeholder="Search by name, status, assigned work, specialty..."
                  className="pl-9 rounded-xl"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-140 overflow-y-auto text-gray-900 dark:text-black" data-sidebar-content>
              {filteredTechnicians.map((tech) => (
                <div
                  key={tech.id}
                  onClick={() => handleTechnicianSelect(tech)}
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
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="text-xs truncate" title={tech.email}>{tech.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span className="text-xs">{tech.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="text-xs truncate" title={tech.location.address}>{tech.location.address}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-3xl border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Technician Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <Input
              placeholder="Full name"
              value={newTechForm.fullName}
              onChange={(event) => setNewTechForm((prev) => ({ ...prev, fullName: event.target.value }))}
              className="rounded-xl"
            />
            <Input
              placeholder="Email"
              type="email"
              value={newTechForm.email}
              onChange={(event) => setNewTechForm((prev) => ({ ...prev, email: event.target.value }))}
              className="rounded-xl"
            />
            <Input
              placeholder="Phone (optional)"
              value={newTechForm.phone}
              onChange={(event) => setNewTechForm((prev) => ({ ...prev, phone: event.target.value }))}
              className="rounded-xl"
            />
            <Input
              placeholder="Temporary password"
              type="password"
              value={newTechForm.password}
              onChange={(event) => setNewTechForm((prev) => ({ ...prev, password: event.target.value }))}
              className="rounded-xl"
            />
            <Button
              onClick={handleCreateTechnician}
              disabled={isCreating}
              className="rounded-xl"
            >
              {isCreating ? 'Adding...' : 'Add Technician'}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              onClick={handleDeactivateSelectedTechnician}
              disabled={isRemoving || !selectedTech}
              className="rounded-xl"
            >
              {isRemoving ? 'Removing...' : 'Remove Selected Technician'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-3xl border-none shadow-lg bg-linear-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{filteredTechnicians.filter((tech) => tech.status === 'available').length}</div>
                <div className="text-sm opacity-90 mt-1">{t('technician.status.available')}</div>
              </div>
              <User className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg bg-linear-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{filteredTechnicians.filter((tech) => tech.status === 'assigned').length}</div>
                <div className="text-sm opacity-90 mt-1">{t('technician.status.assigned')}</div>
              </div>
              <Navigation className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg bg-linear-to-br from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{filteredTechnicians.filter((tech) => tech.status === 'offline').length}</div>
                <div className="text-sm opacity-90 mt-1">{t('technician.status.offline')}</div>
              </div>
              <User className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg bg-linear-to-br from-cyan-500 to-cyan-600 dark:from-cyan-600 dark:to-cyan-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{filteredTechnicians.filter((tech) => tech.status === 'onsite').length}</div>
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