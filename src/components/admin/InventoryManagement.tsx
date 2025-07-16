import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Package, AlertTriangle, Plus, Edit } from 'lucide-react';
import { useMenu } from '@/hooks/useMenu';
import type { Tables } from '@/integrations/supabase/types';

type InventoryItem = Tables<'inventory'> & {
  menu_items: {
    name: string;
    category_id: string | null;
    menu_categories: {
      name: string;
    } | null;
  } | null;
};

const InventoryManagement = () => {
  const queryClient = useQueryClient();
  const { data: menuCategories } = useMenu();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isAddingStock, setIsAddingStock] = useState(false);

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          menu_items (
            name,
            category_id,
            menu_categories (
              name
            )
          )
        `)
        .order('current_stock', { ascending: true });

      if (error) throw error;
      return data as InventoryItem[];
    }
  });

  const updateStock = useMutation({
    mutationFn: async ({ 
      id, 
      currentStock, 
      minStockAlert, 
      maxStock, 
      unitCost 
    }: { 
      id: string; 
      currentStock: number; 
      minStockAlert: number; 
      maxStock: number; 
      unitCost: number;
    }) => {
      const { error } = await supabase
        .from('inventory')
        .update({
          current_stock: currentStock,
          min_stock_alert: minStockAlert,
          max_stock: maxStock,
          unit_cost: unitCost,
          last_restocked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSelectedItem(null);
      toast.success('Stock actualizado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar stock: ' + error.message);
    }
  });

  const addInventoryItem = useMutation({
    mutationFn: async ({ 
      menuItemId, 
      currentStock, 
      minStockAlert, 
      maxStock, 
      unitCost,
      supplierInfo 
    }: { 
      menuItemId: string; 
      currentStock: number; 
      minStockAlert: number; 
      maxStock: number; 
      unitCost: number;
      supplierInfo: string;
    }) => {
      const { error } = await supabase
        .from('inventory')
        .insert([{
          menu_item_id: menuItemId,
          current_stock: currentStock,
          min_stock_alert: minStockAlert,
          max_stock: maxStock,
          unit_cost: unitCost,
          supplier_info: supplierInfo
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsAddingStock(false);
      toast.success('Producto agregado al inventario');
    },
    onError: (error) => {
      toast.error('Error al agregar al inventario: ' + error.message);
    }
  });

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { label: 'Sin Stock', color: 'bg-red-100 text-red-800' };
    if (current <= min) return { label: 'Stock Bajo', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'En Stock', color: 'bg-green-100 text-green-800' };
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando inventario...</div>;
  }

  const lowStockItems = inventory?.filter(item => 
    item.current_stock <= (item.min_stock_alert || 10)
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Control de Inventario</h3>
          {lowStockItems.length > 0 && (
            <div className="flex items-center gap-2 mt-1 text-sm text-orange-600">
              <AlertTriangle className="w-4 h-4" />
              {lowStockItems.length} productos con stock bajo
            </div>
          )}
        </div>
        <Dialog open={isAddingStock} onOpenChange={setIsAddingStock}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Producto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Producto al Inventario</DialogTitle>
            </DialogHeader>
            <AddInventoryForm 
              menuCategories={menuCategories || []}
              onSubmit={addInventoryItem.mutate}
              isLoading={addInventoryItem.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <span className="font-medium">{item.menu_items?.name}</span>
                    <div className="text-sm text-gray-600">
                      Stock actual: {item.current_stock} | Mínimo: {item.min_stock_alert}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setSelectedItem(item)}
                  >
                    Reabastecer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {inventory?.map((item) => {
          const status = getStockStatus(item.current_stock, item.min_stock_alert || 10);
          
          return (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{item.menu_items?.name}</h4>
                      <Badge className={status.color}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Stock Actual:</span>
                        <div className="text-lg font-semibold text-gray-900">
                          {item.current_stock}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Stock Mínimo:</span>
                        <div>{item.min_stock_alert}</div>
                      </div>
                      <div>
                        <span className="font-medium">Stock Máximo:</span>
                        <div>{item.max_stock}</div>
                      </div>
                      <div>
                        <span className="font-medium">Costo Unitario:</span>
                        <div>${item.unit_cost}</div>
                      </div>
                    </div>
                    {item.supplier_info && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Proveedor:</span> {item.supplier_info}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedItem(item)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar Stock - {selectedItem.menu_items?.name}</DialogTitle>
            </DialogHeader>
            <UpdateStockForm 
              item={selectedItem}
              onSubmit={updateStock.mutate}
              isLoading={updateStock.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

interface AddInventoryFormProps {
  menuCategories: any[];
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const AddInventoryForm: React.FC<AddInventoryFormProps> = ({ menuCategories, onSubmit, isLoading }) => {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      onSubmit({
        menuItemId: formData.get('menuItemId') as string,
        currentStock: parseInt(formData.get('currentStock') as string),
        minStockAlert: parseInt(formData.get('minStockAlert') as string),
        maxStock: parseInt(formData.get('maxStock') as string),
        unitCost: parseFloat(formData.get('unitCost') as string),
        supplierInfo: formData.get('supplierInfo') as string
      });
    }}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="menuItemId">Producto del Menú</Label>
          <select id="menuItemId" name="menuItemId" className="w-full p-2 border rounded" required>
            <option value="">Seleccionar producto</option>
            {menuCategories.flatMap(category => 
              category.menu_items?.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {category.name} - {item.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="currentStock">Stock Actual</Label>
            <Input id="currentStock" name="currentStock" type="number" required />
          </div>
          <div>
            <Label htmlFor="minStockAlert">Stock Mínimo</Label>
            <Input id="minStockAlert" name="minStockAlert" type="number" defaultValue="10" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maxStock">Stock Máximo</Label>
            <Input id="maxStock" name="maxStock" type="number" defaultValue="1000" required />
          </div>
          <div>
            <Label htmlFor="unitCost">Costo Unitario ($)</Label>
            <Input id="unitCost" name="unitCost" type="number" step="0.01" required />
          </div>
        </div>
        <div>
          <Label htmlFor="supplierInfo">Información del Proveedor</Label>
          <Input id="supplierInfo" name="supplierInfo" />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          Agregar al Inventario
        </Button>
      </div>
    </form>
  );
};

interface UpdateStockFormProps {
  item: InventoryItem;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const UpdateStockForm: React.FC<UpdateStockFormProps> = ({ item, onSubmit, isLoading }) => {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      onSubmit({
        id: item.id,
        currentStock: parseInt(formData.get('currentStock') as string),
        minStockAlert: parseInt(formData.get('minStockAlert') as string),
        maxStock: parseInt(formData.get('maxStock') as string),
        unitCost: parseFloat(formData.get('unitCost') as string)
      });
    }}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="currentStock">Stock Actual</Label>
            <Input 
              id="currentStock" 
              name="currentStock" 
              type="number" 
              defaultValue={item.current_stock}
              required 
            />
          </div>
          <div>
            <Label htmlFor="minStockAlert">Stock Mínimo</Label>
            <Input 
              id="minStockAlert" 
              name="minStockAlert" 
              type="number" 
              defaultValue={item.min_stock_alert || 10}
              required 
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maxStock">Stock Máximo</Label>
            <Input 
              id="maxStock" 
              name="maxStock" 
              type="number" 
              defaultValue={item.max_stock || 1000}
              required 
            />
          </div>
          <div>
            <Label htmlFor="unitCost">Costo Unitario ($)</Label>
            <Input 
              id="unitCost" 
              name="unitCost" 
              type="number" 
              step="0.01" 
              defaultValue={item.unit_cost || 0}
              required 
            />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          Actualizar Stock
        </Button>
      </div>
    </form>
  );
};

export default InventoryManagement;
