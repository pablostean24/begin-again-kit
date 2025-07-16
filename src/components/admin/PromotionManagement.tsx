
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Calendar, Percent } from 'lucide-react';
import { useMenu } from '@/hooks/useMenu';
import type { Tables } from '@/integrations/supabase/types';

type Promotion = Tables<'promotions'>;

const PromotionManagement = () => {
  const queryClient = useQueryClient();
  const { data: menuCategories } = useMenu();
  const [isAddingPromotion, setIsAddingPromotion] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Promotion[];
    }
  });

  const addPromotion = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      discount_type: string;
      discount_value: number;
      min_order_amount?: number;
      max_discount_amount?: number;
      promo_code?: string;
      start_date: string;
      end_date: string;
      usage_limit?: number;
      applicable_items?: string[];
    }) => {
      const { error } = await supabase
        .from('promotions')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      setIsAddingPromotion(false);
      toast.success('Promoción creada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear promoción: ' + error.message);
    }
  });

  const updatePromotion = useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      description: string;
      discount_type: string;
      discount_value: number;
      min_order_amount?: number;
      max_discount_amount?: number;
      promo_code?: string;
      start_date: string;
      end_date: string;
      usage_limit?: number;
      applicable_items?: string[];
      is_active: boolean;
    }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from('promotions')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      setEditingPromotion(null);
      toast.success('Promoción actualizada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar promoción: ' + error.message);
    }
  });

  const togglePromotionStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('promotions')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Estado de promoción actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar estado: ' + error.message);
    }
  });

  const isPromotionExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const isPromotionActive = (startDate: string, endDate: string) => {
    const now = new Date();
    return new Date(startDate) <= now && new Date(endDate) >= now;
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando promociones...</div>;
  }

  const activePromotions = promotions?.filter(p => p.is_active && isPromotionActive(p.start_date, p.end_date)) || [];
  const expiredPromotions = promotions?.filter(p => isPromotionExpired(p.end_date)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Promociones</h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
            <span>Total: {promotions?.length || 0}</span>
            <span>Activas: {activePromotions.length}</span>
            <span>Expiradas: {expiredPromotions.length}</span>
          </div>
        </div>
        <Dialog open={isAddingPromotion} onOpenChange={setIsAddingPromotion}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Promoción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nueva Promoción</DialogTitle>
            </DialogHeader>
            <PromotionForm 
              menuCategories={menuCategories || []}
              onSubmit={addPromotion.mutate}
              isLoading={addPromotion.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {promotions?.map((promotion) => {
          const isExpired = isPromotionExpired(promotion.end_date);
          const isCurrentlyActive = isPromotionActive(promotion.start_date, promotion.end_date);
          
          return (
            <Card key={promotion.id} className={isExpired ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-lg">{promotion.name}</h4>
                      <div className="flex items-center gap-2">
                        {promotion.is_active && isCurrentlyActive && !isExpired && (
                          <Badge className="bg-green-100 text-green-800">Activa</Badge>
                        )}
                        {isExpired && (
                          <Badge className="bg-red-100 text-red-800">Expirada</Badge>
                        )}
                        {!promotion.is_active && (
                          <Badge className="bg-gray-100 text-gray-800">Inactiva</Badge>
                        )}
                        {promotion.promo_code && (
                          <Badge variant="outline">
                            Código: {promotion.promo_code}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{promotion.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        <span>
                          {promotion.discount_type === 'percentage' && `${promotion.discount_value}%`}
                          {promotion.discount_type === 'fixed_amount' && `$${promotion.discount_value}`}
                          {promotion.discount_type === 'buy_x_get_y' && `Compra ${promotion.discount_value}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(promotion.start_date).toLocaleDateString()} - {new Date(promotion.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {promotion.min_order_amount && (
                        <div>
                          Mínimo: ${promotion.min_order_amount}
                        </div>
                      )}
                      
                      {promotion.usage_limit && (
                        <div>
                          Usos: {promotion.usage_count || 0}/{promotion.usage_limit}
                        </div>
                      )}
                    </div>
                    
                    {promotion.applicable_items && promotion.applicable_items.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Aplicable a {promotion.applicable_items.length} productos específicos
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={promotion.is_active || false}
                        onCheckedChange={(checked) => 
                          togglePromotionStatus.mutate({ 
                            id: promotion.id, 
                            isActive: checked 
                          })
                        }
                        disabled={isExpired}
                      />
                      <span className="text-sm">Activa</span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPromotion(promotion)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {promotions?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay promociones creadas
          </div>
        )}
      </div>

      {editingPromotion && (
        <Dialog open={!!editingPromotion} onOpenChange={() => setEditingPromotion(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Promoción</DialogTitle>
            </DialogHeader>
            <PromotionForm 
              promotion={editingPromotion}
              menuCategories={menuCategories || []}
              onSubmit={(data) => updatePromotion.mutate({ ...data, id: editingPromotion.id })}
              isLoading={updatePromotion.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

interface PromotionFormProps {
  promotion?: Promotion;
  menuCategories: any[];
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const PromotionForm: React.FC<PromotionFormProps> = ({ promotion, menuCategories, onSubmit, isLoading }) => {
  const [discountType, setDiscountType] = useState(promotion?.discount_type || 'percentage');
  const [selectedItems, setSelectedItems] = useState<string[]>(promotion?.applicable_items || []);
  const [isActive, setIsActive] = useState(promotion?.is_active ?? true);

  const allMenuItems = menuCategories.flatMap(category => 
    category.menu_items?.map((item: any) => ({ 
      id: item.id, 
      name: item.name, 
      category: category.name 
    })) || []
  );

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const data = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        discount_type: discountType,
        discount_value: parseFloat(formData.get('discount_value') as string),
        min_order_amount: formData.get('min_order_amount') ? parseFloat(formData.get('min_order_amount') as string) : undefined,
        max_discount_amount: formData.get('max_discount_amount') ? parseFloat(formData.get('max_discount_amount') as string) : undefined,
        promo_code: formData.get('promo_code') as string || undefined,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string,
        usage_limit: formData.get('usage_limit') ? parseInt(formData.get('usage_limit') as string) : undefined,
        applicable_items: selectedItems.length > 0 ? selectedItems : undefined,
        ...(promotion && { is_active: isActive })
      };
      onSubmit(data);
    }}>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nombre de la Promoción</Label>
            <Input id="name" name="name" defaultValue={promotion?.name} required />
          </div>
          <div>
            <Label htmlFor="promo_code">Código Promocional (Opcional)</Label>
            <Input id="promo_code" name="promo_code" defaultValue={promotion?.promo_code || ''} />
          </div>
        </div>
        
        <div>
          <Label htmlFor="description">Descripción</Label>
          <Textarea id="description" name="description" defaultValue={promotion?.description || ''} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="discount_type">Tipo de Descuento</Label>
            <select 
              id="discount_type" 
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="percentage">Porcentaje</option>
              <option value="fixed_amount">Cantidad Fija</option>
              <option value="buy_x_get_y">Compra X Llévate Y</option>
            </select>
          </div>
          <div>
            <Label htmlFor="discount_value">Valor del Descuento</Label>
            <Input 
              id="discount_value" 
              name="discount_value" 
              type="number" 
              step="0.01"
              defaultValue={promotion?.discount_value}
              required 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="min_order_amount">Pedido Mínimo ($)</Label>
            <Input 
              id="min_order_amount" 
              name="min_order_amount" 
              type="number" 
              step="0.01"
              defaultValue={promotion?.min_order_amount || ''}
            />
          </div>
          <div>
            <Label htmlFor="max_discount_amount">Descuento Máximo ($)</Label>
            <Input 
              id="max_discount_amount" 
              name="max_discount_amount" 
              type="number" 
              step="0.01"
              defaultValue={promotion?.max_discount_amount || ''}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Fecha de Inicio</Label>
            <Input 
              id="start_date" 
              name="start_date" 
              type="datetime-local"
              defaultValue={promotion?.start_date ? new Date(promotion.start_date).toISOString().slice(0, 16) : ''}
              required 
            />
          </div>
          <div>
            <Label htmlFor="end_date">Fecha de Fin</Label>
            <Input 
              id="end_date" 
              name="end_date" 
              type="datetime-local"
              defaultValue={promotion?.end_date ? new Date(promotion.end_date).toISOString().slice(0, 16) : ''}
              required 
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="usage_limit">Límite de Usos (Opcional)</Label>
          <Input 
            id="usage_limit" 
            name="usage_limit" 
            type="number"
            defaultValue={promotion?.usage_limit || ''}
          />
        </div>
        
        <div>
          <Label>Productos Aplicables (Opcional)</Label>
          <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-2">
            {allMenuItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`item-${item.id}`}
                  checked={selectedItems.includes(item.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedItems([...selectedItems, item.id]);
                    } else {
                      setSelectedItems(selectedItems.filter(id => id !== item.id));
                    }
                  }}
                />
                <label htmlFor={`item-${item.id}`} className="text-sm">
                  {item.category} - {item.name}
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Si no seleccionas productos, la promoción se aplicará a todos
          </p>
        </div>

        {promotion && (
          <div className="flex items-center space-x-2">
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label>Promoción activa</Label>
          </div>
        )}
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {promotion ? 'Actualizar' : 'Crear'} Promoción
        </Button>
      </div>
    </form>
  );
};

export default PromotionManagement;
