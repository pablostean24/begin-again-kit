
import React from 'react';
import { 
  ChefHat, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Gift,
  Grid3X3,
  CreditCard,
  CheckCircle,
  Utensils,
  UserCog
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AdminSidebar = ({ activeTab, setActiveTab }: AdminSidebarProps) => {
  const navigationItems = [
    { value: 'dashboard', label: 'Dashboard', icon: Grid3X3 },
    { value: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { value: 'menu', label: 'Menú', icon: ChefHat },
    { value: 'composite-dishes', label: 'Platos Compuestos', icon: Package },
    { value: 'tables', label: 'Mesas', icon: Utensils },
    { value: 'inventory', label: 'Inventario', icon: Package },
    { value: 'drivers', label: 'Repartidores', icon: Users },
    { value: 'users', label: 'Usuarios', icon: UserCog },
    { value: 'stats', label: 'Estadísticas', icon: BarChart3 },
    { value: 'promotions', label: 'Promociones', icon: Gift },
    { value: 'payment-methods', label: 'Métodos Pago', icon: CreditCard },
    { value: 'payment-verifications', label: 'Verificaciones', icon: CheckCircle }
  ];

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Logo section */}
        <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-orange-600">Flamas</h1>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 w-full text-left ${
                  activeTab === item.value
                    ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon 
                  className={`mr-3 h-5 w-5 transition-colors ${
                    activeTab === item.value ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} 
                />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
