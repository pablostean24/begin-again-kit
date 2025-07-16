
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';
import { ReactNode } from 'react';

type AppRole = Database['public']['Enums']['app_role'];

interface RoleGuardProps {
  allowedRoles: AppRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

const RoleGuard = ({ allowedRoles, children, fallback }: RoleGuardProps) => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // If no role matches and no fallback, don't render anything
    // This prevents showing unauthorized content
    return null;
  }

  return <>{children}</>;
};

export default RoleGuard;
