import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import { getServiceBgColor } from '@/app/utils/serviceColors';
import { getServiceCategories, NEW_CATEGORY_VALUE, resolveServiceCategory } from '@/app/utils/serviceCatalog';
import { api as mockApi, type Service } from '@/app/services/api';
import { Plus, Edit, DollarSign, Clock, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export function ServicesView() {
  const [services, setServices] = useState<Service[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [createCategory, setCreateCategory] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const categories: string[] = useMemo(() => getServiceCategories(services), [services]);

  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      try {
        const data = await mockApi.getServices();
        setServices(data);
        setCreateCategory(getServiceCategories(data)[0] || '');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load services';
        toast.error(message);
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadServices();
  }, []);

  useEffect(() => {
    if (!editingService) {
      setEditCategory('');
      return;
    }

    setEditCategory(categories.includes(editingService.category) ? editingService.category : NEW_CATEGORY_VALUE);
  }, [editingService, categories]);

  useEffect(() => {
    setExpandedCategories((currentState) => {
      const nextState: Record<string, boolean> = {};

      categories.forEach((category: string) => {
        nextState[category] = currentState[category] ?? true;
      });

      return nextState;
    });
  }, [categories]);

  const handleCreateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const category = resolveServiceCategory(createCategory, formData.get('newCategory'));

    if (!category) {
      toast.error('Select an existing category or enter a new one.');
      return;
    }
    
    const newService = await mockApi.createService({
      name: formData.get('name') as string,
      category,
      basePrice: Number(formData.get('basePrice')),
      duration: Number(formData.get('duration')),
      description: formData.get('description') as string,
      color: formData.get('color') as string || '#3b82f6',
    });

    setServices((currentServices) => [...currentServices, newService]);
    setIsCreateDialogOpen(false);
    setCreateCategory(category);
    toast.success('Service created successfully!');
  };

  const handleUpdateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingService) return;

    const formData = new FormData(e.currentTarget);
    const category = resolveServiceCategory(editCategory, formData.get('newCategory'));

    if (!category) {
      toast.error('Select an existing category or enter a new one.');
      return;
    }
    
    const updated = await mockApi.updateService(editingService.id, {
      name: formData.get('name') as string,
      category,
      basePrice: Number(formData.get('basePrice')),
      duration: Number(formData.get('duration')),
      description: formData.get('description') as string,
      color: formData.get('color') as string,
    });

    setServices((currentServices) => currentServices.map((service) => service.id === updated.id ? updated : service));
    setEditingService(null);
    toast.success('Service updated successfully!');
  };

  const handleToggleActive = async (service: Service) => {
    const updated = await mockApi.updateService(service.id, {
      isActive: !service.isActive
    });
    setServices((currentServices) => currentServices.map((currentService) => currentService.id === updated.id ? updated : currentService));
    toast.success(`Service ${updated.isActive ? 'activated' : 'deactivated'}`);
  };

  const servicesByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const orderedServiceCategories = Object.entries(servicesByCategory) as Array<[string, Service[]]>;
  orderedServiceCategories.sort(([left], [right]) => left.localeCompare(right));

  const averagePrice = services.length > 0
    ? (services.reduce((sum, service) => sum + service.basePrice, 0) / services.length).toFixed(0)
    : '0';

  const toggleCategory = (category: string) => {
    setExpandedCategories((currentState) => ({
      ...currentState,
      [category]: !currentState[category],
    }));
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading Services & Pricing..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">Services & Pricing</h1>
          <p className="text-gray-500 mt-1">Manage the cleaning service catalog, pricing, and custom categories.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
              <Plus className="w-4 h-4 mt-[2px]" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-3xl">
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateService} className="space-y-4 flex flex-col">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                Use Category = New when you need to create a new section such as HVAC, Plumbing, or any custom cleaning group.
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="name" className="mb-1 ml-1">Service Name</Label>
                  <Input id="name" name="name" required className="rounded-xl" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="category" className="mb-1 ml-1">Category</Label>
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
                  <Label htmlFor="newCategory" className="mb-1 ml-1">New Category Name</Label>
                  <Input id="newCategory" name="newCategory" placeholder="Example: HVAC" required className="rounded-xl" />
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="basePrice" className="mb-1 ml-1">Base Price (AED)</Label>
                  <Input id="basePrice" name="basePrice" type="number" required className="rounded-xl" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="duration" className="mb-1 ml-1">Duration (minutes)</Label>
                  <Input id="duration" name="duration" type="number" required className="rounded-xl" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="color" className="mb-1 ml-1">Service Color</Label>
                <div className="flex items-center gap-3">
                  <Input 
                    id="color" 
                    name="color" 
                    type="color" 
                    defaultValue="#3b82f6"
                    className="rounded-xl h-12 w-15.5 cursor-pointer" 
                  />
                  <span className="text-sm text-gray-400">Choose a color for the dashboard pie chart</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="description" className="mb-1 ml-1">Description</Label>
                <Textarea id="description" name="description" rows={4} required className="rounded-xl" />
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="rounded-full">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-full bg-blue-600 hover:bg-blue-700">
                  Create Service
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services by Category */}
      {orderedServiceCategories.map(([category, categoryServices]) => {
        const isExpanded = expandedCategories[category] ?? true;

        return (
          <div key={category} className="space-y-4">
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getServiceBgColor(category)}`}></div>
                <h2 className="text-lg font-semibold">{category}</h2>
                <Badge variant="outline">{categoryServices.length} services</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </button>

            {isExpanded && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {categoryServices.map((service) => (
                  <Card key={service.id} className="rounded-3xl border border-slate-200 shadow-sm transition hover:shadow-md dark:border-slate-800">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`mt-0.5 w-10 h-10 ${getServiceBgColor(service.category)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <Tag className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-base text-slate-900 dark:text-white">{service.name}</h3>
                              <Badge className={service.isActive ? 'bg-green-500 hover:bg-green-500 text-white' : 'bg-gray-500 hover:bg-gray-500 text-white'}>
                                {service.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{service.description}</p>
                            <div className="mt-3 flex flex-wrap gap-3 text-base text-slate-600 dark:text-slate-300">
                              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 dark:bg-emerald-950/40">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                                <span className="font-semibold">AED {service.basePrice}</span>
                              </div>
                              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 dark:bg-blue-950/40">
                                <Clock className="h-5 w-5 text-blue-600" />
                                <span className="font-semibold">{service.duration} min</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                        <Button 
                          onClick={() => setEditingService(service)}
                          variant="outline"
                          className="flex-1 rounded-full"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          onClick={() => handleToggleActive(service)}
                          variant="outline"
                          className="rounded-full"
                        >
                          {service.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Edit Service Dialog */}
      <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          {editingService && (
            <form onSubmit={handleUpdateService} className="space-y-4 flex flex-col">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="edit-name">Service Name</Label>
                  <Input 
                    id="edit-name" 
                    name="name" 
                    defaultValue={editingService.name}
                    required 
                    className="rounded-xl" 
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
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

              {editCategory === NEW_CATEGORY_VALUE && (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="edit-newCategory">New Category Name</Label>
                  <Input id="edit-newCategory" name="newCategory" placeholder="Example: Plumbing" required className="rounded-xl" />
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="edit-basePrice">Base Price (AED)</Label>
                  <Input 
                    id="edit-basePrice" 
                    name="basePrice" 
                    type="number" 
                    defaultValue={editingService.basePrice}
                    required 
                    className="rounded-xl" 
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="edit-duration">Duration (minutes)</Label>
                  <Input 
                    id="edit-duration" 
                    name="duration" 
                    type="number" 
                    defaultValue={editingService.duration}
                    required 
                    className="rounded-xl" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="edit-color">Service Color</Label>
                <div className="flex items-center gap-3">
                  <Input 
                    id="edit-color" 
                    name="color" 
                    type="color" 
                    defaultValue={editingService.color || '#3b82f6'}
                    className="rounded-xl h-12 w-20 cursor-pointer" 
                  />
                  <span className="text-sm text-gray-600">Choose a color for the dashboard pie chart</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  name="description" 
                  rows={4} 
                  defaultValue={editingService.description}
                  required 
                  className="rounded-xl" 
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingService(null)} className="rounded-full">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-full bg-blue-600 hover:bg-blue-700">
                  Update Service
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-3xl border-none shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{services.length}</div>
              <div className="text-sm text-gray-400 mt-1">Total Services</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {services.filter(s => s.isActive).length}
              </div>
              <div className="text-sm text-gray-400 mt-1">Active Services</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Object.keys(servicesByCategory).length}
              </div>
              <div className="text-sm text-gray-400 mt-1">Categories</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                AED {averagePrice}
              </div>
              <div className="text-sm text-gray-400 mt-1">Avg Price</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
