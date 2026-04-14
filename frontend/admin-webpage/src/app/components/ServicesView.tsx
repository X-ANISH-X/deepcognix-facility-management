import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import { getServiceColor, getServiceBgColor, AVAILABLE_SERVICES } from '@/app/utils/serviceColors';
import { api, type Service, type Category } from '@/app/services/api';
import { Plus, Edit, DollarSign, Clock, Tag } from 'lucide-react';
import { toast } from 'sonner';

export function ServicesView() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      const [data, cats] = await Promise.all([api.getServices(), api.getCategories()]);
      setServices(data);
      setCategories(cats);
      setIsLoading(false);
    };
    loadServices();
  }, []);

  const handleCreateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const catId = Number(formData.get('categoryId'));
    const cat = categories.find(c => c.id === catId);
    const newService = await api.createService({
      name: formData.get('name') as string,
      category: cat?.name ?? '',
      categoryId: catId,
      basePrice: Number(formData.get('basePrice')),
      duration: Number(formData.get('duration')),
      description: formData.get('description') as string,
    });
    setServices([...services, newService]);
    setIsCreateDialogOpen(false);
    toast.success('Service created successfully!');
  };

  const handleUpdateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingService) return;
    const formData = new FormData(e.currentTarget);
    const catId = Number(formData.get('categoryId'));
    const cat = categories.find(c => c.id === catId);
    const updated = await api.updateService(editingService.rawId, {
      name: formData.get('name') as string,
      category: cat?.name ?? editingService.category,
      categoryId: catId,
      basePrice: Number(formData.get('basePrice')),
      duration: Number(formData.get('duration')),
      description: formData.get('description') as string,
    });
    setServices(services.map(s => s.id === updated.id ? updated : s));
    setEditingService(null);
    toast.success('Service updated successfully!');
  };

  const handleToggleActive = async (service: Service) => {
    const result = await api.toggleServiceActive(service.rawId);
    setServices(services.map(s => s.id === service.id ? { ...s, isActive: result.is_active } : s));
    toast.success(`Service ${result.is_active ? 'activated' : 'deactivated'}`);
  };

  const servicesByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  if (isLoading) {
    return <LoadingSpinner message="Loading Services & Pricing..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">Services & Pricing</h1>
          <p className="text-gray-500 mt-1">Manage service catalog and pricing</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-3xl">
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateService} className="space-y-4 flex flex-col">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="name">Service Name</Label>
                  <Input id="name" name="name" required className="rounded-xl" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="categoryId">Category</Label>
                  <Select name="categoryId" required>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="basePrice">Base Price ($)</Label>
                  <Input id="basePrice" name="basePrice" type="number" required className="rounded-xl" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input id="duration" name="duration" type="number" required className="rounded-xl" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="description">Description</Label>
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
      {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
        <div key={category}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${getServiceBgColor(category)}`}></div>
            <h2 className="text-xl font-bold">{category}</h2>
            <Badge variant="outline">{categoryServices.length} services</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryServices.map((service) => (
              <Card key={service.id} className="rounded-3xl border-none shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-10 h-10 ${getServiceBgColor(service.category)} rounded-xl flex items-center justify-center`}>
                          <Tag className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <h3 className="font-bold text-lg">{service.name}</h3>
                      <Badge 
                        className={`mt-2 ${service.isActive ? 'bg-green-500 hover:bg-green-500' : 'bg-gray-500 hover:bg-gray-500'} text-white`}
                      >
                        {service.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-600">Base Price</span>
                      </div>
                      <span className="font-bold text-lg">${service.basePrice}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-600">Duration</span>
                      </div>
                      <span className="font-bold">{service.duration} min</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
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
        </div>
      ))}

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
                  <Select name="category" defaultValue={editingService.category} required>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_SERVICES.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="edit-basePrice">Base Price ($)</Label>
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
              <div className="text-sm text-gray-600 mt-1">Total Services</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {services.filter(s => s.isActive).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Active Services</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Object.keys(servicesByCategory).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Categories</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                ${(services.reduce((sum, s) => sum + s.basePrice, 0) / services.length).toFixed(0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Avg Price</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
