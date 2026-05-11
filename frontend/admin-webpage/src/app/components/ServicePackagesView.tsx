import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/app/components/ui/collapsible';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import { api as mockApi, type Service, type ServicePackage } from '@/app/services/api';
import { getServiceBgColor, getServiceColor } from '@/app/utils/serviceColors';
import { getServiceCategories, NEW_CATEGORY_VALUE, resolveServiceCategory } from '@/app/utils/serviceCatalog';
import { Check, ChevronDown, PackagePlus, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function ServicePackagesView() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatePackageOpen, setIsCreatePackageOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [editingSelectedServiceIds, setEditingSelectedServiceIds] = useState<string[]>([]);
  const [editingIsActive, setEditingIsActive] = useState(true);
  const [createCategory, setCreateCategory] = useState('');
  const [collapsedCreateCategories, setCollapsedCreateCategories] = useState<string[]>([]);
  const [collapsedEditCategories, setCollapsedEditCategories] = useState<string[]>([]);

  const categories: string[] = useMemo(() => getServiceCategories(services), [services]);
  const servicesByCategory = useMemo(() => {
    return services.reduce((accumulator, service) => {
      if (!accumulator[service.category]) {
        accumulator[service.category] = [];
      }

      accumulator[service.category].push(service);
      return accumulator;
    }, {} as Record<string, Service[]>);
  }, [services]);

  const orderedServiceCategories = useMemo(
    () => (Object.entries(servicesByCategory) as Array<[string, Service[]]>).sort(([left], [right]) => left.localeCompare(right)),
    [servicesByCategory],
  );

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [servicePackages, serviceCatalog] = await Promise.all([
          mockApi.getServicePackages(),
          mockApi.getServices(),
        ]);
        setPackages(servicePackages);
        setServices(serviceCatalog);
        setCreateCategory(getServiceCategories(serviceCatalog)[0] || '');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load service packages';
        toast.error(message);
        setPackages([]);
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!editingPackage) {
      setEditingSelectedServiceIds([]);
      setEditingIsActive(true);
      return;
    }

    setEditingSelectedServiceIds(editingPackage.serviceIds);
    setEditingIsActive(editingPackage.isActive);
  }, [editingPackage]);

  const seededPackageOrder = ['Silver Package', 'Gold Package', 'Platinum Package'];
  const orderedPackages = useMemo(() => {
    return [...packages].sort((left, right) => {
      const leftRank = seededPackageOrder.indexOf(left.name);
      const rightRank = seededPackageOrder.indexOf(right.name);

      if (leftRank !== -1 || rightRank !== -1) {
        if (leftRank === -1) return 1;
        if (rightRank === -1) return -1;
        return leftRank - rightRank;
      }

      return left.name.localeCompare(right.name);
    });
  }, [packages]);

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServiceIds((currentSelection) =>
      currentSelection.includes(serviceId)
        ? currentSelection.filter((currentId) => currentId !== serviceId)
        : [...currentSelection, serviceId],
    );
  };

  const toggleEditingServiceSelection = (serviceId: string) => {
    setEditingSelectedServiceIds((currentSelection) =>
      currentSelection.includes(serviceId)
        ? currentSelection.filter((currentId) => currentId !== serviceId)
        : [...currentSelection, serviceId],
    );
  };

  const toggleCollapsedCategory = (category: string, target: 'create' | 'edit') => {
    if (target === 'create') {
      setCollapsedCreateCategories((current) => current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]);
      return;
    }

    setCollapsedEditCategories((current) => current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]);
  };

  const handleCreatePackage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (selectedServiceIds.length === 0) {
      toast.error('Select at least one service for the package.');
      return;
    }

    const newPackage = await mockApi.createServicePackage({
      name: String(formData.get('name') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      serviceIds: selectedServiceIds,
      estimatedTimes: {},
    });

    setPackages((currentPackages) => [...currentPackages, newPackage]);
    setSelectedServiceIds([]);
    setIsCreatePackageOpen(false);
    toast.success('Service package created successfully!');
  };

  const handleCreateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const category = resolveServiceCategory(createCategory, formData.get('newCategory'));

    if (!category) {
      toast.error('Select an existing category or enter a new one.');
      return;
    }

    const newService = await mockApi.createService({
      name: String(formData.get('name') || '').trim(),
      category,
      basePrice: Number(formData.get('basePrice')),
      duration: Number(formData.get('duration')),
      description: String(formData.get('description') || '').trim(),
      color: String(formData.get('color') || '#3b82f6'),
    });

    setServices((currentServices) => [...currentServices, newService]);
    setSelectedServiceIds((currentSelection) => [...currentSelection, newService.id]);
    setCreateCategory(category);
    setIsCreateServiceOpen(false);
    toast.success('Service created and added to the package.');
  };

  const handleUpdatePackage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingPackage) {
      return;
    }

    if (editingSelectedServiceIds.length === 0) {
      toast.error('Select at least one service for the package.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const updatedPackage = await mockApi.updateServicePackage(editingPackage.id, {
      name: String(formData.get('name') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      serviceIds: editingSelectedServiceIds,
      isActive: editingIsActive,
    });

    setPackages((currentPackages) => currentPackages.map((currentPackage) => (
      currentPackage.id === updatedPackage.id ? updatedPackage : currentPackage
    )));
    setEditingPackage(null);
    toast.success('Service package updated successfully!');
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading service packages..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">Service Packages</h1>
          <p className="text-gray-500 mt-1">Bundle apartment cleaning services into Silver, Gold, Platinum, or custom admin packages.</p>
        </div>

        <Dialog open={isCreatePackageOpen} onOpenChange={setIsCreatePackageOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap">
              <PackagePlus className="w-4 h-4 mt-0.5" />
              New Package
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[min(96vw,72rem)] max-w-none rounded-3xl">
            <DialogHeader>
              <DialogTitle>Create Service Package</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreatePackage} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="package-name">Package Name</Label>
                  <Input id="package-name" name="name" required className="rounded-xl" placeholder="Example: Move-Out Refresh" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="package-description">Description</Label>
                <Textarea id="package-description" name="description" rows={3} className="rounded-xl" placeholder="Internal summary or customer-facing package description" />
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Sparkles className="h-4 w-4" />
                  {selectedServiceIds.length} service{selectedServiceIds.length === 1 ? '' : 's'} selected
                </div>
                <Dialog open={isCreateServiceOpen} onOpenChange={setIsCreateServiceOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" className="rounded-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Service While Building Package
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl rounded-3xl">
                    <DialogHeader>
                      <DialogTitle>Create New Service</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleCreateService} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="inline-service-name">Service Name</Label>
                          <Input id="inline-service-name" name="name" required className="rounded-xl" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="inline-service-category">Category</Label>
                          <Select value={createCategory} onValueChange={setCreateCategory}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category: string) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                              <SelectItem value={NEW_CATEGORY_VALUE}>New category</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {createCategory === NEW_CATEGORY_VALUE && (
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="inline-new-category">New Category Name</Label>
                          <Input id="inline-new-category" name="newCategory" required className="rounded-xl" placeholder="Example: HVAC" />
                        </div>
                      )}

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="inline-base-price">Base Price (AED)</Label>
                          <Input id="inline-base-price" name="basePrice" type="number" required className="rounded-xl" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="inline-duration">Duration (minutes)</Label>
                          <Input id="inline-duration" name="duration" type="number" required className="rounded-xl" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <Label htmlFor="inline-color">Service Color</Label>
                        <Input id="inline-color" name="color" type="color" defaultValue="#3b82f6" className="rounded-xl h-12 w-20 cursor-pointer" />
                      </div>

                      <div className="flex flex-col gap-1">
                        <Label htmlFor="inline-description">Description</Label>
                        <Textarea id="inline-description" name="description" rows={4} required className="rounded-xl" />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="rounded-full" onClick={() => setIsCreateServiceOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="rounded-full bg-blue-600 hover:bg-blue-700">
                          Save Service
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="max-h-[52vh] overflow-y-auto space-y-6 pr-1">
                {orderedServiceCategories.map(([category, categoryServices]) => (
                  <Collapsible key={category} open={!collapsedCreateCategories.includes(category)} onOpenChange={() => toggleCollapsedCategory(category, 'create')}>
                    <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/20">
                      <div className="flex items-center justify-between gap-3">
                        <CollapsibleTrigger asChild>
                          <button type="button" className="flex items-center gap-3 text-left">
                            <div className={`h-3 w-3 rounded-full ${getServiceBgColor(category)}`}></div>
                            <h3 className="font-semibold">{category}</h3>
                            <Badge variant="outline">{categoryServices.length}</Badge>
                            <ChevronDown className={`h-4 w-4 transition-transform ${collapsedCreateCategories.includes(category) ? '-rotate-90' : 'rotate-0'}`} />
                          </button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 pt-3">
                          {categoryServices.map((service) => {
                            const isSelected = selectedServiceIds.includes(service.id);

                            return (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => toggleServiceSelection(service.id)}
                                className={`rounded-3xl border p-4 text-left transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50 shadow-md dark:border-emerald-500 dark:bg-emerald-950/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950/30'}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="font-semibold text-slate-900 dark:text-white">{service.name}</div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-base text-slate-500">
                                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-medium dark:bg-slate-800">{service.duration} min</span>
                                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">AED {service.basePrice}</span>
                                    </div>
                                  </div>
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                    <Check className="h-4 w-4" />
                                  </div>
                                </div>
                                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{service.description}</p>
                              </button>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                  ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setIsCreatePackageOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-full bg-emerald-600 hover:bg-emerald-700">
                  Save Package
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog
        open={!!editingPackage}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPackage(null);
          }
        }}
      >
        <DialogContent className="w-[min(96vw,72rem)] max-w-none rounded-3xl">
          <DialogHeader>
            <DialogTitle>Edit Service Package</DialogTitle>
          </DialogHeader>

          {editingPackage && (
            <form onSubmit={handleUpdatePackage} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="edit-package-name">Package Name</Label>
                  <Input id="edit-package-name" name="name" defaultValue={editingPackage.name} required className="rounded-xl" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="edit-package-status">Status</Label>
                  <Select value={editingIsActive ? 'active' : 'inactive'} onValueChange={(value) => setEditingIsActive(value === 'active')}>
                    <SelectTrigger id="edit-package-status" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="edit-package-description">Description</Label>
                <Textarea id="edit-package-description" name="description" rows={3} defaultValue={editingPackage.description} className="rounded-xl" />
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Sparkles className="h-4 w-4" />
                  {editingSelectedServiceIds.length} service{editingSelectedServiceIds.length === 1 ? '' : 's'} selected
                </div>
              </div>

              <div className="max-h-[52vh] overflow-y-auto space-y-6 pr-1">
                {orderedServiceCategories.map(([category, categoryServices]) => (
                  <Collapsible key={category} open={!collapsedEditCategories.includes(category)} onOpenChange={() => toggleCollapsedCategory(category, 'edit')}>
                    <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/20">
                      <div className="flex items-center justify-between gap-3">
                        <CollapsibleTrigger asChild>
                          <button type="button" className="flex items-center gap-3 text-left">
                            <div className={`h-3 w-3 rounded-full ${getServiceBgColor(category)}`}></div>
                            <h3 className="font-semibold">{category}</h3>
                            <Badge variant="outline">{categoryServices.length}</Badge>
                            <ChevronDown className={`h-4 w-4 transition-transform ${collapsedEditCategories.includes(category) ? '-rotate-90' : 'rotate-0'}`} />
                          </button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 pt-3">
                          {categoryServices.map((service) => {
                            const isSelected = editingSelectedServiceIds.includes(service.id);

                            return (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => toggleEditingServiceSelection(service.id)}
                                className={`rounded-3xl border p-4 text-left transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50 shadow-md dark:border-emerald-500 dark:bg-emerald-950/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950/30'}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="font-semibold text-slate-900 dark:text-white">{service.name}</div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-base text-slate-500">
                                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-medium dark:bg-slate-800">{service.duration} min</span>
                                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">AED {service.basePrice}</span>
                                    </div>
                                  </div>
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                    <Check className="h-4 w-4" />
                                  </div>
                                </div>
                                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{service.description}</p>
                              </button>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setEditingPackage(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-full bg-emerald-600 hover:bg-emerald-700">
                  Update Package
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 xl:grid-cols-2">
        {orderedPackages.map((servicePackage) => {
          const bundledServices = servicePackage.serviceIds
            .map((serviceId: string) => services.find((service: Service) => service.id === serviceId))
            .filter((service: Service | undefined): service is Service => Boolean(service));

          return (
            <Card key={servicePackage.id} className="rounded-3xl border-none shadow-lg">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold">{servicePackage.name}</h2>
                      <Badge className={servicePackage.isActive ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-slate-500 hover:bg-slate-500'}>
                        {servicePackage.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{servicePackage.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="rounded-2xl bg-slate-100 px-4 py-3 text-center dark:bg-slate-900/70">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">{bundledServices.length}</div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Bundled Services</div>
                    </div>
                    <Button type="button" variant="outline" className="rounded-full" onClick={() => setEditingPackage(servicePackage)}>
                      Edit Package
                    </Button>
                  </div>
                </div>

                {Object.keys(servicePackage.estimatedTimes).length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {(Object.entries(servicePackage.estimatedTimes) as Array<[string, string]>).map(([apartmentType, duration]) => (
                      <div key={apartmentType} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{apartmentType}</div>
                        <div className="mt-2 font-semibold text-slate-900 dark:text-white">{duration}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Included Services</div>
                  <div className="flex flex-wrap gap-2">
                    {bundledServices.map((service: Service) => (
                      <Badge key={service.id} className={getServiceColor(service.category)}>
                        {service.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}