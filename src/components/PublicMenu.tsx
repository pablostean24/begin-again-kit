
import { useState } from 'react';
import { useMenu } from '@/hooks/useMenu';
import { usePublicCompositeDishes } from '@/hooks/usePublicCompositeDishes';
import MenuFilter from './MenuFilter';
import MenuItemCard from './MenuItemCard';
import CompositeDishCard from './CompositeDishCard';
import { Card, CardContent } from '@/components/ui/card';

const PublicMenu = () => {
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useMenu();
  const { data: compositeDishes, isLoading: dishesLoading, error: dishesError } = usePublicCompositeDishes();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isLoading = categoriesLoading || dishesLoading;
  const error = categoriesError || dishesError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando menú...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error al cargar el menú. Inténtalo de nuevo más tarde.</p>
        </CardContent>
      </Card>
    );
  }

  // Filter items based on category and search
  const filterItems = (items: any[], searchTerm: string) => {
    if (!searchTerm) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Get filtered regular menu items
  const getFilteredMenuItems = () => {
    // Si está seleccionada la categoría "composite", no mostrar items regulares
    if (selectedCategory === 'composite') return [];
    
    let allItems: any[] = [];
    
    if (categories) {
      categories.forEach(category => {
        if (selectedCategory === null || selectedCategory === category.id) {
          if (category.menu_items) {
            allItems.push(...category.menu_items);
          }
        }
      });
    }
    
    return filterItems(allItems, searchTerm);
  };

  // Get filtered composite dishes
  const getFilteredCompositeDishes = () => {
    // Si está seleccionada una categoría específica (no "composite" ni null), no mostrar platos compuestos
    if (selectedCategory !== null && selectedCategory !== 'composite') return [];
    
    if (!compositeDishes) return [];
    return filterItems(compositeDishes, searchTerm);
  };

  const filteredMenuItems = getFilteredMenuItems();
  const filteredCompositeDishes = getFilteredCompositeDishes();
  const totalFilteredItems = filteredMenuItems.length + filteredCompositeDishes.length;

  const hasCompositeDishes = compositeDishes && compositeDishes.length > 0;
  const hasCategories = categories && categories.length > 0;

  if (!hasCompositeDishes && !hasCategories) {
    return (
      <Card className="bg-gray-50">
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">No hay productos disponibles en este momento.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Nuestro Menú</h1>
        <p className="text-gray-600">Usa nuestro buscador y filtros para encontrar exactamente lo que buscas.</p>
      </div>
      
      {/* Filters */}
      <MenuFilter
        categories={categories || []}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalItems={totalFilteredItems}
        compositeDishesCount={compositeDishes?.length || 0}
      />
      
      {/* Results */}
      <div className="space-y-8">
        {/* Composite Dishes */}
        {filteredCompositeDishes.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              🍽️ Platos Personalizables
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCompositeDishes.map((dish) => (
                <CompositeDishCard key={dish.id} dish={dish} />
              ))}
            </div>
          </div>
        )}
        
        {/* Regular Menu Items */}
        {filteredMenuItems.length > 0 && (
          <div>
            {filteredCompositeDishes.length > 0 && (
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                🍴 Menú Regular
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMenuItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
        
        {/* No Results */}
        {totalFilteredItems === 0 && (
          <Card className="bg-gray-50">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-gray-600">
                Intenta cambiar los filtros o buscar otros términos.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicMenu;
