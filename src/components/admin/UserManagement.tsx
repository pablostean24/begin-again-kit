
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Edit, Ban, CheckCircle, Plus } from 'lucide-react';
import { useUserManagement, UserWithRole } from '@/hooks/useUserManagement';
import UserDetailsDialog from './UserDetailsDialog';
import UserEditDialog from './UserEditDialog';
import UserCreateDialog from './UserCreateDialog';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const UserManagement = () => {
  const {
    users,
    loading,
    roleFilter,
    setRoleFilter,
    searchTerm,
    setSearchTerm,
    updateUserRole,
    toggleUserStatus,
    refetchUsers,
  } = useUserManagement();

  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const getRoleBadgeColor = (role: AppRole) => {
    const colors = {
      cliente: 'bg-blue-100 text-blue-800',
      restaurant: 'bg-green-100 text-green-800',
      delivery: 'bg-yellow-100 text-yellow-800',
      mesero: 'bg-purple-100 text-purple-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: AppRole) => {
    const labels = {
      cliente: 'Cliente',
      restaurant: 'Restaurante',
      delivery: 'Repartidor',
      mesero: 'Mesero',
    };
    return labels[role] || role;
  };

  const handleViewDetails = (user: UserWithRole) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  const handleEditUser = (user: UserWithRole) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const handleToggleStatus = async (user: UserWithRole) => {
    await toggleUserStatus(user.id, !user.is_active);
  };

  const handleCreateUser = () => {
    setShowCreateDialog(true);
  };

  const handleUserCreated = () => {
    refetchUsers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-gray-600">Administra todos los usuarios del sistema</p>
        </div>
        <Button onClick={handleCreateUser} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Crear Usuario
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={(value: AppRole | 'all') => setRoleFilter(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="cliente">Clientes</SelectItem>
            <SelectItem value="restaurant">Restaurantes</SelectItem>
            <SelectItem value="delivery">Repartidores</SelectItem>
            <SelectItem value="mesero">Meseros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Fecha Registro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.full_name || 'Sin nombre'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.is_active ? (
                          <Ban className="h-4 w-4 text-red-600" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      {selectedUser && (
        <>
          <UserDetailsDialog
            user={selectedUser}
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
          />
          <UserEditDialog
            user={selectedUser}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onUserUpdated={updateUserRole}
          />
        </>
      )}
      
      <UserCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
};

export default UserManagement;
