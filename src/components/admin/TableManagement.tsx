
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type RestaurantTable = Tables<'restaurant_tables'>;

const TableManagement = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [formData, setFormData] = useState({
    table_number: '',
    capacity: 4,
    zone: '',
  });

  const statusColors = {
    available: 'bg-green-100 text-green-800',
    occupied: 'bg-red-100 text-red-800',
    cleaning: 'bg-yellow-100 text-yellow-800',
  };

  const statusLabels = {
    available: 'Disponible',
    occupied: 'Ocupada',
    cleaning: 'Limpieza',
  };

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('table_number');

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Error al cargar las mesas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();

    // Set up real-time subscription
    const channel = supabase
      .channel('restaurant_tables_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_tables'
        },
        () => {
          fetchTables();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreate = async () => {
    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .insert([
          {
            table_number: formData.table_number,
            capacity: formData.capacity,
            zone: formData.zone || null,
            status: 'available'
          }
        ]);

      if (error) throw error;

      toast.success('Mesa creada exitosamente');
      setIsCreateDialogOpen(false);
      setFormData({ table_number: '', capacity: 4, zone: '' });
      fetchTables();
    } catch (error) {
      console.error('Error creating table:', error);
      toast.error('Error al crear la mesa');
    }
  };

  const handleUpdate = async () => {
    if (!editingTable) return;

    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .update({
          table_number: formData.table_number,
          capacity: formData.capacity,
          zone: formData.zone || null,
        })
        .eq('id', editingTable.id);

      if (error) throw error;

      toast.success('Mesa actualizada exitosamente');
      setIsEditDialogOpen(false);
      setEditingTable(null);
      setFormData({ table_number: '', capacity: 4, zone: '' });
      fetchTables();
    } catch (error) {
      console.error('Error updating table:', error);
      toast.error('Error al actualizar la mesa');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta mesa?')) return;

    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Mesa eliminada exitosamente');
      fetchTables();
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Error al eliminar la mesa');
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'available' | 'occupied' | 'cleaning') => {
    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success('Estado actualizado exitosamente');
      fetchTables();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const openEditDialog = (table: RestaurantTable) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number,
      capacity: table.capacity,
      zone: table.zone || '',
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando mesas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Mesas</h2>
          <p className="text-gray-600">Administra las mesas del restaurante</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Mesa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Mesa</DialogTitle>
              <DialogDescription>
                Configura los detalles de la nueva mesa del restaurante.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="table_number">Número de Mesa</Label>
                <Input
                  id="table_number"
                  value={formData.table_number}
                  onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                  placeholder="Ej: 1, A1, VIP-1"
                />
              </div>
              <div>
                <Label htmlFor="capacity">Capacidad</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 4 })}
                />
              </div>
              <div>
                <Label htmlFor="zone">Zona (Opcional)</Label>
                <Input
                  id="zone"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="Ej: Interior, Terraza, VIP"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>Crear Mesa</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <Card key={table.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Mesa {table.table_number}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {table.capacity} personas
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(table)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(table.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estado:</span>
                  <Badge className={statusColors[table.status as keyof typeof statusColors]}>
                    {statusLabels[table.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
                
                {table.zone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Zona:</span>
                    <span className="text-sm text-gray-600">{table.zone}</span>
                  </div>
                )}

                <div className="pt-2">
                  <Label className="text-sm font-medium">Cambiar Estado:</Label>
                  <Select
                    value={table.status}
                    onValueChange={(value: 'available' | 'occupied' | 'cleaning') => 
                      handleStatusChange(table.id, value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="occupied">Ocupada</SelectItem>
                      <SelectItem value="cleaning">Limpieza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Mesa</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la mesa seleccionada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_table_number">Número de Mesa</Label>
              <Input
                id="edit_table_number"
                value={formData.table_number}
                onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                placeholder="Ej: 1, A1, VIP-1"
              />
            </div>
            <div>
              <Label htmlFor="edit_capacity">Capacidad</Label>
              <Input
                id="edit_capacity"
                type="number"
                min="1"
                max="20"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 4 })}
              />
            </div>
            <div>
              <Label htmlFor="edit_zone">Zona (Opcional)</Label>
              <Input
                id="edit_zone"
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                placeholder="Ej: Interior, Terraza, VIP"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate}>Actualizar Mesa</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableManagement;
