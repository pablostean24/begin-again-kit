
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, LogOut } from 'lucide-react';

const UserProfile = () => {
  const { user, userRole, signOut } = useAuth();

  if (!user) return null;

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'restaurant':
        return 'bg-blue-100 text-blue-800';
      case 'delivery':
        return 'bg-green-100 text-green-800';
      case 'cliente':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string | null) => {
    switch (role) {
      case 'restaurant':
        return 'Restaurante';
      case 'delivery':
        return 'Repartidor';
      case 'cliente':
        return 'Cliente';
      default:
        return 'Sin rol';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Perfil de Usuario
        </CardTitle>
        <CardDescription>
          Información de tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <p className="text-gray-900">{user.email}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700">Rol</label>
          <div className="mt-1">
            <Badge className={getRoleBadgeColor(userRole)}>
              {getRoleDisplayName(userRole)}
            </Badge>
          </div>
        </div>

        <div className="pt-4">
          <Button 
            onClick={signOut} 
            variant="outline" 
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
