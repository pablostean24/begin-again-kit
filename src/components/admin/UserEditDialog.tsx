
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserWithRole } from '@/hooks/useUserManagement';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserEditDialogProps {
  user: UserWithRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: (userId: string, newRole: AppRole) => Promise<boolean>;
}

const UserEditDialog = ({ user, open, onOpenChange, onUserUpdated }: UserEditDialogProps) => {
  const [selectedRole, setSelectedRole] = useState<AppRole>(user.role);
  const [loading, setLoading] = useState(false);

  const getRoleLabel = (role: AppRole) => {
    const labels = {
      cliente: 'Cliente',
      restaurant: 'Restaurante',
      delivery: 'Repartidor',
      mesero: 'Mesero',
    };
    return labels[role] || role;
  };

  const handleSave = async () => {
    if (selectedRole === user.role) {
      onOpenChange(false);
      return;
    }

    setLoading(true);
    const success = await onUserUpdated(user.id, selectedRole);
    setLoading(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setSelectedRole(user.role); // Reset to original role
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Nombre</label>
            <p className="text-gray-900">{user.full_name || 'Sin nombre'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Correo</label>
            <p className="text-gray-900">{user.email}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Cambiar Rol
            </label>
            <Select value={selectedRole} onValueChange={(value: AppRole) => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="restaurant">Restaurante</SelectItem>
                <SelectItem value="delivery">Repartidor</SelectItem>
                <SelectItem value="mesero">Mesero</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditDialog;
