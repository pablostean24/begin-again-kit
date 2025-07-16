
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminMobileNav from '@/components/admin/AdminMobileNav';
import AdminContent from '@/components/admin/AdminContent';

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    const handleQuickAccess = (event: CustomEvent) => {
      const value = event.detail;
      switch (value) {
        case 'orders':
          setActiveTab('orders');
          break;
        case 'menu':
          setActiveTab('menu');
          break;
        case 'stats':
          setActiveTab('stats');
          break;
        case 'customer-view':
          window.open('/', '_blank');
          break;
        default:
          break;
      }
    };

    window.addEventListener('quickAccess', handleQuickAccess as EventListener);
    return () => {
      window.removeEventListener('quickAccess', handleQuickAccess as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Header */}
      <AdminHeader />
      
      {/* Mobile Navigation */}
      <AdminMobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main content */}
      <AdminContent activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default Admin;
