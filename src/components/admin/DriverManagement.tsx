
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, User, Phone, Car } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Driver = Tables<'delivery_drivers'>;

const DriverManagement = () => {
  const queryClient = useQueryClient();
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['delivery-drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Driver[];
    }
  });

  const addDriver = useMutation({
    mutationFn: async (data: {
      full_name: string;
      phone: string;
      email?: string;
      vehicle_type: string;
      license_plate?: string;
      max_concurrent_orders: number;
    }) => {
      const { error } = await supabase
        .from('delivery_drivers')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-drivers'] });
      setIsAddingDriver(false);
      toast.success('Repartidor agregado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al agregar repartidor: ' + error.message);
    }
  });

  const updateDriver = useMutation({
    mutationFn: async (data: {
      id: string;
      full_name: string;
      phone: string;
      email?: string;
      vehicle_type: string;
      license_plate?: string;
      max_concurrent_orders: number;
      is_active: boolean;
      is_available: boolean;
    }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from('delivery_drivers')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-drivers'] });
      setEditingDriver(null);
      toast.success('Repartidor actualizado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar repartidor: ' + error.message);
    }
  });

  const toggleDriverStatus = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: 'is_active' | 'is_available'; value: boolean }) => {
      const { error } = await supabase
        .from('delivery_drivers')
        .update({ 
          [field]: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-drivers'] });
      toast.success('Estado actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar estado: ' + error.message);
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">Cargando repartidores...</div>;
  }

  const activeDrivers = drivers?.filter(d => d.is_active) || [];
  const availableDrivers = activeDrivers.filter(d => d.is_available);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Repartidores</h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
            <span>Total: {drivers?.length || 0}</span>
            <span>Activos: {activeDrivers.length}</span>
            <span>Disponibles: {availableDrivers.length}</span>
          </div>
        </div>
        <Dialog open={isAddingDriver} onOpenChange={setIsAddingDriver}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Repartidor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Repartidor</DialogTitle>
            </DialogHeader>
            <DriverForm 
              onSubmit={addDriver.mutate}
              isLoading={addDriver.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {drivers?.map((driver) => (
          <Card key={driver.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <h4 className="font-medium">{driver.full_name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {driver.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Activo</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>
                      )}
                      {driver.is_available && driver.is_active && (
                        <Badge className="bg-blue-100 text-blue-800">Disponible</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {driver.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      {driver.vehicle_type}
                    </div>
                    <div>
                      Pedidos actuales: {driver.current_orders_count || 0}/{driver.max_concurrent_orders}
                    </div>
                    <div>
                      Rating: ⭐ {driver.rating}/5
                    </div>
                  </div>
                  
                  {driver.license_plate && (
                    <div className="mt-2 text-sm text-gray-600">
                      Placa: {driver.license_plate}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={driver.is_active || false}
                        onCheckedChange={(checked) => 
                          toggleDriverStatus.mutate({ 
                            id: driver.id, 
                            field: 'is_active', 
                            value: checked 
                          })
                        }
                      />
                      <span className="text-sm">Activo</span>
                    </div>
                    {driver.is_active && (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={driver.is_available || false}
                          onCheckedChange={(checked) => 
                            toggleDriverStatus.mutate({ 
                              id: driver.id, 
                              field: 'is_available', 
                              value: checked 
                            })
                          }
                        />
                        <span className="text-sm">Disponible</span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDriver(driver)}
                  >
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {drivers?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay repartidores registrados
          </div>
        )}
      </div>

      {editingDriver && (
        <Dialog open={!!editingDriver} onOpenChange={() => setEditingDriver(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Repartidor</DialogTitle>
            </DialogHeader>
            <DriverForm 
              driver={editingDriver}
              onSubmit={(data) => updateDriver.mutate({ ...data, id: editingDriver.id })}
              isLoading={updateDriver.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

interface DriverFormProps {
  driver?: Driver;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const DriverForm: React.FC<DriverFormProps> = ({ driver, onSubmit, isLoading }) => {
  const [isActive, setIsActive] = useState(driver?.is_active ?? true);
  const [isAvailable, setIsAvailable] = useState(driver?.is_available ?? true);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const data = {
        full_name: formData.get('full_name') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string || undefined,
        vehicle_type: formData.get('vehicle_type') as string,
        license_plate: formData.get('license_plate') as string || undefined,
        max_concurrent_orders: parseInt(formData.get('max_concurrent_orders') as string),
        ...(driver && { is_active: isActive, is_available: isAvailable })
      };
      onSubmit(data);
    }}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="full_name">Nombre Completo</Label>
          <Input id="full_name" name="full_name" defaultValue={driver?.full_name} required />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" defaultValue={driver?.phone} required />
          </div>
          <div>
            <Label htmlFor="email">Email (Opcional)</Label>
            <Input id="email" name="email" type="email" defaultValue={driver?.email || ''} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="vehicle_type">Tipo de Vehículo</Label>
            <select 
              id="vehicle_type" 
              name="vehicle_type" 
              className="w-full p-2 border rounded"
              defaultValue={driver?.vehicle_type || ''}
              required
            >
              <option value="">Seleccionar</option>
              <option value="bike">Bicicleta</option>
              <option value="motorcycle">Motocicleta</option>
              <option value="car">Coche</option>
              <option value="walking">A pie</option>
            </select>
          </div>
          <div>
            <Label htmlFor="license_plate">Placa (Opcional)</Label>
            <Input id="license_plate" name="license_plate" defaultValue={driver?.license_plate || ''} />
          </div>
        </div>
        
        <div>
          <Label htmlFor="max_concurrent_orders">Máximo de Pedidos Simultáneos</Label>
          <Input 
            id="max_concurrent_orders" 
            name="max_concurrent_orders" 
            type="number" 
            min="1" 
            max="10"
            defaultValue={driver?.max_concurrent_orders || 3}
            required 
          />
        </div>

        {driver && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label>Repartidor activo</Label>
            </div>
            {isActive && (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
                />
                <Label>Disponible para pedidos</Label>
              </div>
            )}
          </div>
        )}
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {driver ? 'Actualizar' : 'Agregar'} Repartidor
        </Button>
      </div>
    </form>
  );
};

export default DriverManagement;
