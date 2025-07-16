
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaymentMethod } from '@/types/payment';

interface PaymentMethodFormData {
  payment_type: 'Pago Móvil' | 'Transferencia Bancaria' | 'Zelle' | 'Otro';
  account_number: string;
  phone_number?: string;
  owner_id: string;
  destination_bank: string;
  account_holder_name?: string;
  other_type_description?: string;
}

const PaymentMethodsManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<PaymentMethodFormData>();

  const watchedPaymentType = watch('payment_type');

  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ['admin-payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('payment_type');

      if (error) {
        console.error('Error fetching payment methods:', error);
        throw error;
      }

      return data as PaymentMethod[];
    }
  });

  const createPaymentMethod = useMutation({
    mutationFn: async (data: PaymentMethodFormData) => {
      const { error } = await supabase
        .from('payment_methods')
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
      toast.success('Método de pago creado exitosamente');
      reset();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Error al crear método de pago: ' + error.message);
    }
  });

  const updatePaymentMethod = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PaymentMethodFormData> }) => {
      const { error } = await supabase
        .from('payment_methods')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
      toast.success('Método de pago actualizado exitosamente');
      reset();
      setIsDialogOpen(false);
      setEditingMethod(null);
    },
    onError: (error) => {
      toast.error('Error al actualizar método de pago: ' + error.message);
    }
  });

  const togglePaymentMethodStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
      toast.success('Estado actualizado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar estado: ' + error.message);
    }
  });

  const onSubmit = (data: PaymentMethodFormData) => {
    if (editingMethod) {
      updatePaymentMethod.mutate({ id: editingMethod.id, data });
    } else {
      createPaymentMethod.mutate(data);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setValue('payment_type', method.payment_type);
    setValue('account_number', method.account_number);
    setValue('phone_number', method.phone_number || '');
    setValue('owner_id', method.owner_id);
    setValue('destination_bank', method.destination_bank);
    setValue('account_holder_name', method.account_holder_name || '');
    setValue('other_type_description', method.other_type_description || '');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMethod(null);
    reset();
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando métodos de pago...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestión de Métodos de Pago</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Método
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingMethod ? 'Editar' : 'Agregar'} Método de Pago
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Pago</Label>
                  <Select 
                    value={watchedPaymentType} 
                    onValueChange={(value) => setValue('payment_type', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pago Móvil">Pago Móvil</SelectItem>
                      <SelectItem value="Transferencia Bancaria">Transferencia Bancaria</SelectItem>
                      <SelectItem value="Zelle">Zelle</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination_bank">Banco</Label>
                  <Input
                    id="destination_bank"
                    {...register('destination_bank', { required: 'El banco es requerido' })}
                    placeholder="Ej: Banco de Venezuela"
                  />
                  {errors.destination_bank && (
                    <span className="text-red-500 text-sm">{errors.destination_bank.message}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_number">Número de Cuenta</Label>
                  <Input
                    id="account_number"
                    {...register('account_number', { required: 'El número de cuenta es requerido' })}
                    placeholder="Número de cuenta"
                  />
                  {errors.account_number && (
                    <span className="text-red-500 text-sm">{errors.account_number.message}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner_id">Cédula del Titular</Label>
                  <Input
                    id="owner_id"
                    {...register('owner_id', { required: 'La cédula es requerida' })}
                    placeholder="V-12345678"
                  />
                  {errors.owner_id && (
                    <span className="text-red-500 text-sm">{errors.owner_id.message}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_holder_name">Nombre del Titular</Label>
                  <Input
                    id="account_holder_name"
                    {...register('account_holder_name')}
                    placeholder="Nombre completo del titular"
                  />
                </div>

                {(watchedPaymentType === 'Pago Móvil' || watchedPaymentType === 'Zelle') && (
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Teléfono</Label>
                    <Input
                      id="phone_number"
                      {...register('phone_number')}
                      placeholder="04121234567"
                    />
                  </div>
                )}

                {watchedPaymentType === 'Otro' && (
                  <div className="space-y-2">
                    <Label htmlFor="other_type_description">Descripción</Label>
                    <Input
                      id="other_type_description"
                      {...register('other_type_description')}
                      placeholder="Describe el método de pago"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingMethod ? 'Actualizar' : 'Crear'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Titular</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods?.map((method) => (
                <TableRow key={method.id}>
                  <TableCell>{method.payment_type}</TableCell>
                  <TableCell>{method.destination_bank}</TableCell>
                  <TableCell>{method.account_number}</TableCell>
                  <TableCell>{method.account_holder_name || method.owner_id}</TableCell>
                  <TableCell>
                    <Badge variant={method.is_active ? "default" : "secondary"}>
                      {method.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(method)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePaymentMethodStatus.mutate({ 
                          id: method.id, 
                          is_active: !method.is_active 
                        })}
                      >
                        {method.is_active ? <Trash2 className="w-4 h-4" /> : 'Activar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {paymentMethods?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay métodos de pago configurados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentMethodsManagement;
