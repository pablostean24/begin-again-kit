
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const AdminHeader = () => {
  const { user } = useAuth();

  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Usuario';
  };

  const getInitials = () => {
    const name = getDisplayName();
    if (name === 'Usuario') return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 lg:pl-64">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile logo - only show on smaller screens */}
          <div className="lg:hidden">
            <h1 className="text-xl font-bold text-orange-600">Flamas</h1>
          </div>
          
          {/* User info and actions */}
          <div className="flex items-center space-x-4 ml-auto">
            <div className="hidden sm:flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-orange-100 text-orange-600">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600">{getDisplayName()}</span>
            </div>
            
            {/* Mobile user indicator */}
            <div className="sm:hidden">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-orange-100 text-orange-600">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <Link to="/">
              <Button variant="outline" size="sm">
                <Home className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
