
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];
type AppRole = Database['public']['Enums']['app_role'];

export interface UserWithRole extends Profile {
  role: AppRole;
  created_at: string;
  is_active: boolean;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles first
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los perfiles de usuario",
          variant: "destructive",
        });
        return;
      }

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los roles de usuario",
          variant: "destructive",
        });
        return;
      }

      // Combine profiles with their roles
      const usersWithRoles: UserWithRole[] = profilesData
        .map((profile) => {
          const userRole = rolesData.find(role => role.user_id === profile.id);
          if (!userRole) {
            console.log(`No role found for user ${profile.id}`);
            return null;
          }
          
          return {
            ...profile,
            role: userRole.role,
            is_active: true, // Default to active, could be managed through auth.users
          };
        })
        .filter((user): user is UserWithRole => user !== null);

      setUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast({
        title: "Error",
        description: "Error al cargar usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el rol del usuario",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Éxito",
        description: "Rol actualizado correctamente",
      });

      // Refresh users list
      await fetchUsers();
      return true;
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      return false;
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      // Note: In a real implementation, you might want to disable/enable the user in auth.users
      // For now, we'll just update our local state
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, is_active: isActive } : user
      );
      
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);

      toast({
        title: "Éxito", 
        description: `Usuario ${isActive ? 'activado' : 'desactivado'} correctamente`,
      });

      return true;
    } catch (error) {
      console.error('Error in toggleUserStatus:', error);
      return false;
    }
  };

  // Filter users based on role and search term
  useEffect(() => {
    let filtered = users;

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [users, roleFilter, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users: filteredUsers,
    loading,
    roleFilter,
    setRoleFilter,
    searchTerm,
    setSearchTerm,
    updateUserRole,
    toggleUserStatus,
    refetchUsers: fetchUsers,
  };
};
