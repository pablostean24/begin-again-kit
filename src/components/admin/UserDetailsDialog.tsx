
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { UserWithRole } from '@/hooks/useUserManagement';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserDetailsDialogProps {
  user: UserWithRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserDetailsDialog = ({ user, open, onOpenChange }: UserDetailsDialogProps) => {
  const getRoleLabel = (role: AppRole) => {
    const labels = {
      cliente: 'Cliente',
      restaurant: 'Restaurante',
      delivery: 'Repartidor',
      mesero: 'Mesero',
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: AppRole) => {
    const colors = {
      cliente: 'bg-blue-100 text-blue-800',
      restaurant: 'bg-green-100 text-green-800',
      delivery: 'bg-yellow-100 text-yellow-800',
      mesero: 'bg-purple-100 text-purple-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detalles del Usuario</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
            <p className="text-gray-900">{user.full_name || 'Sin nombre'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Correo Electrónico</label>
            <p className="text-gray-900">{user.email}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Rol</label>
            <div className="mt-1">
              <Badge className={getRoleBadgeColor(user.role)}>
                {getRoleLabel(user.role)}
              </Badge>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Fecha de Registro</label>
            <p className="text-gray-900">
              {new Date(user.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Estado</label>
            <div className="mt-1">
              <Badge variant={user.is_active ? 'default' : 'secondary'}>
                {user.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">ID de Usuario</label>
            <p className="text-gray-600 text-sm font-mono">{user.id}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsDialog;
