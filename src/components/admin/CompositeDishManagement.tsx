import React, { useState } from 'react';
import { useCompositeDishes } from '@/hooks/useCompositeDishes';
import { useMenu } from '@/hooks/useMenu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Package, ChefHat } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type MenuItem = Tables<'menu_items'>;
type MenuCategory = Tables<'menu_categories'>;

const CompositeDishManagement = () => {
  const { compositeDishes, isLoading, createCompositeDish, updateCompositeDish, deleteCompositeDish } = useCompositeDishes();
  const { data: menuData } = useMenu();
  const [isCreating, setIsCreating] = useState(false);
  const [editingDish, setEditingDish] = useState(null);

  const categories = menuData || [];
  const allMenuItems = categories.flatMap(cat => cat.menu_items || []);

  if (isLoading) {
    return <div className="text-center py-8">Cargando platos compuestos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gestión de Platos Compuestos</h3>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Plato Compuesto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Plato Compuesto</DialogTitle>
            </DialogHeader>
            <CompositeDishForm
              categories={categories}
              menuItems={allMenuItems}
              onSubmit={createCompositeDish.mutate}
              onClose={() => setIsCreating(false)}
              isLoading={createCompositeDish.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {compositeDishes?.map((dish) => (
          <Card key={dish.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChefHat className="w-5 h-5" />
                  {dish.name}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-orange-600">
                    ${dish.base_price}
                  </span>
                  <Dialog open={editingDish?.id === dish.id} onOpenChange={(open) => setEditingDish(open ? dish : null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingDish(dish)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Editar Plato Compuesto</DialogTitle>
                      </DialogHeader>
                      <CompositeDishForm
                        categories={categories}
                        menuItems={allMenuItems}
                        initialData={dish}
                        onSubmit={(data) => {
                          updateCompositeDish.mutate({ id: dish.id, ...data });
                          setEditingDish(null);
                        }}
                        onClose={() => setEditingDish(null)}
                        isLoading={updateCompositeDish.isPending}
                        isEditing={true}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteCompositeDish.mutate(dish.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dish.description && (
                  <p className="text-gray-600">{dish.description}</p>
                )}
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Productos base */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Productos Base (Obligatorios)
                    </h4>
                    <div className="space-y-2">
                      {dish.dish_base_products?.map((baseProduct) => (
                        <div key={baseProduct.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>{baseProduct.menu_items.name}</span>
                          <span className="text-sm text-gray-600">
                            Cantidad: {baseProduct.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Elementos opcionales */}
                  <div>
                    <h4 className="font-medium mb-2">Elementos Opcionales</h4>
                    <div className="space-y-2">
                      {dish.dish_optional_elements?.map((optionalElement) => (
                        <div key={optionalElement.id} className="p-2 bg-blue-50 rounded">
                          <div className="flex items-center justify-between">
                            <span>{optionalElement.menu_items.name}</span>
                            <div className="flex items-center gap-2 text-sm">
                              {optionalElement.is_included_by_default && (
                                <span className="text-green-600">Incluido</span>
                              )}
                              {optionalElement.additional_price > 0 && (
                                <span className="text-orange-600">
                                  +${optionalElement.additional_price}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {optionalElement.dish_replacement_options?.length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                              <span className="font-medium">Reemplazos disponibles:</span>
                              <div className="ml-2">
                                {optionalElement.dish_replacement_options.map((replacement) => (
                                  <div key={replacement.id} className="flex items-center justify-between">
                                    <span>{replacement.replacement_menu_items.name}</span>
                                    {replacement.price_difference !== 0 && (
                                      <span className={replacement.price_difference > 0 ? 'text-orange-600' : 'text-green-600'}>
                                        {replacement.price_difference > 0 ? '+' : ''}${replacement.price_difference}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-500 flex items-center gap-4">
                  <span>⏱️ {dish.preparation_time}</span>
                  <span>📅 Creado: {new Date(dish.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {compositeDishes?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay platos compuestos creados aún
          </div>
        )}
      </div>
    </div>
  );
};

interface CompositeDishFormProps {
  categories: (MenuCategory & { menu_items: MenuItem[] })[];
  menuItems: MenuItem[];
  onSubmit: (data: any) => void;
  onClose: () => void;
  isLoading: boolean;
  initialData?: any;
  isEditing?: boolean;
}

const CompositeDishForm: React.FC<CompositeDishFormProps> = ({
  categories,
  menuItems,
  onSubmit,
  onClose,
  isLoading,
  initialData,
  isEditing = false
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    base_price: initialData?.base_price || 0,
    category_id: initialData?.category_id || '',
    preparation_time: initialData?.preparation_time || '25-30 min',
    base_products: initialData?.dish_base_products?.map(bp => ({
      menu_item_id: bp.menu_item_id,
      quantity: bp.quantity
    })) || [],
    optional_elements: initialData?.dish_optional_elements?.map(oe => ({
      menu_item_id: oe.menu_item_id,
      is_included_by_default: oe.is_included_by_default,
      additional_price: oe.additional_price,
      element_type: oe.element_type,
      replacement_options: oe.dish_replacement_options?.map(ro => ({
        replacement_item_id: ro.replacement_item_id,
        price_difference: ro.price_difference
      })) || []
    })) || []
  });

  const addBaseProduct = () => {
    setFormData(prev => ({
      ...prev,
      base_products: [...prev.base_products, { menu_item_id: '', quantity: 1 }]
    }));
  };

  const removeBaseProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      base_products: prev.base_products.filter((_, i) => i !== index)
    }));
  };

  const addOptionalElement = () => {
    setFormData(prev => ({
      ...prev,
      optional_elements: [...prev.optional_elements, {
        menu_item_id: '',
        is_included_by_default: true,
        additional_price: 0,
        element_type: 'side',
        replacement_options: []
      }]
    }));
  };

  const removeOptionalElement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      optional_elements: prev.optional_elements.filter((_, i) => i !== index)
    }));
  };

  const addReplacementOption = (elementIndex: number) => {
    setFormData(prev => {
      const newElements = [...prev.optional_elements];
      newElements[elementIndex].replacement_options.push({
        replacement_item_id: '',
        price_difference: 0
      });
      return { ...prev, optional_elements: newElements };
    });
  };

  const removeReplacementOption = (elementIndex: number, optionIndex: number) => {
    setFormData(prev => {
      const newElements = [...prev.optional_elements];
      newElements[elementIndex].replacement_options = newElements[elementIndex].replacement_options.filter((_, i) => i !== optionIndex);
      return { ...prev, optional_elements: newElements };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.base_products.length === 0) {
      toast.error('Debe agregar al menos un producto base');
      return;
    }

    // Validate that all base products have valid menu_item_id
    const invalidBaseProducts = formData.base_products.some(product => !product.menu_item_id);
    if (invalidBaseProducts) {
      toast.error('Todos los productos base deben tener un elemento seleccionado');
      return;
    }

    // Validate that all optional elements have valid menu_item_id
    const invalidOptionalElements = formData.optional_elements.some(element => !element.menu_item_id);
    if (invalidOptionalElements) {
      toast.error('Todos los elementos opcionales deben tener un elemento seleccionado');
      return;
    }

    // Clean up the form data before submitting
    const cleanedData = {
      ...formData,
      // Convert empty category_id to null
      category_id: formData.category_id || null,
      // Filter out base products with empty menu_item_id
      base_products: formData.base_products.filter(product => product.menu_item_id),
      // Filter out optional elements with empty menu_item_id
      optional_elements: formData.optional_elements.filter(element => element.menu_item_id).map(element => ({
        ...element,
        replacement_options: element.replacement_options.filter(option => option.replacement_item_id)
      }))
    };

    console.log('Submitting composite dish data:', cleanedData);
    onSubmit(cleanedData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nombre del Plato</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="base_price">Precio Base ($)</Label>
          <Input
            id="base_price"
            type="number"
            step="0.01"
            value={formData.base_price}
            onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Categoría</Label>
          <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="preparation_time">Tiempo de Preparación</Label>
          <Input
            id="preparation_time"
            value={formData.preparation_time}
            onChange={(e) => setFormData(prev => ({ ...prev, preparation_time: e.target.value }))}
          />
        </div>
      </div>

      {/* Base Products Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Productos Base (Obligatorios)</h4>
          <Button type="button" variant="outline" size="sm" onClick={addBaseProduct}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>
        
        {formData.base_products.map((product, index) => (
          <div key={index} className="flex items-center gap-2 p-3 border rounded">
            <Select
              value={product.menu_item_id}
              onValueChange={(value) => {
                const newProducts = [...formData.base_products];
                newProducts[index].menu_item_id = value;
                setFormData(prev => ({ ...prev, base_products: newProducts }));
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {menuItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="number"
              min="1"
              value={product.quantity}
              onChange={(e) => {
                const newProducts = [...formData.base_products];
                newProducts[index].quantity = parseInt(e.target.value);
                setFormData(prev => ({ ...prev, base_products: newProducts }));
              }}
              className="w-20"
              placeholder="Cant."
            />
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeBaseProduct(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Optional Elements Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Elementos Opcionales</h4>
          <Button type="button" variant="outline" size="sm" onClick={addOptionalElement}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>
        
        {formData.optional_elements.map((element, index) => (
          <div key={index} className="p-3 border rounded space-y-3">
            <div className="flex items-center gap-2">
              <Select
                value={element.menu_item_id}
                onValueChange={(value) => {
                  const newElements = [...formData.optional_elements];
                  newElements[index].menu_item_id = value;
                  setFormData(prev => ({ ...prev, optional_elements: newElements }));
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar elemento" />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeOptionalElement(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={element.is_included_by_default}
                  onCheckedChange={(checked) => {
                    const newElements = [...formData.optional_elements];
                    newElements[index].is_included_by_default = checked;
                    setFormData(prev => ({ ...prev, optional_elements: newElements }));
                  }}
                />
                <Label className="text-sm">Incluido por defecto</Label>
              </div>
              
              <div>
                <Label className="text-sm">Precio adicional ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={element.additional_price}
                  onChange={(e) => {
                    const newElements = [...formData.optional_elements];
                    newElements[index].additional_price = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({ ...prev, optional_elements: newElements }));
                  }}
                />
              </div>
              
              <div>
                <Label className="text-sm">Tipo</Label>
                <Select
                  value={element.element_type}
                  onValueChange={(value) => {
                    const newElements = [...formData.optional_elements];
                    newElements[index].element_type = value;
                    setFormData(prev => ({ ...prev, optional_elements: newElements }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="side">Acompañamiento</SelectItem>
                    <SelectItem value="drink">Bebida</SelectItem>
                    <SelectItem value="bread">Pan</SelectItem>
                    <SelectItem value="sauce">Salsa</SelectItem>
                    <SelectItem value="dessert">Postre</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Replacement Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Opciones de Reemplazo</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addReplacementOption(index)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar Reemplazo
                </Button>
              </div>
              
              {element.replacement_options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <Select
                    value={option.replacement_item_id}
                    onValueChange={(value) => {
                      const newElements = [...formData.optional_elements];
                      newElements[index].replacement_options[optionIndex].replacement_item_id = value;
                      setFormData(prev => ({ ...prev, optional_elements: newElements }));
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Producto de reemplazo" />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems
                        .filter(item => item.id !== element.menu_item_id) // No permitir reemplazar por el mismo producto
                        .map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="number"
                    step="0.01"
                    value={option.price_difference}
                    onChange={(e) => {
                      const newElements = [...formData.optional_elements];
                      newElements[index].replacement_options[optionIndex].price_difference = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({ ...prev, optional_elements: newElements }));
                    }}
                    className="w-24"
                    placeholder="Dif. $"
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeReplacementOption(index, optionIndex)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ? 'Actualizar Plato Compuesto' : 'Crear Plato Compuesto')}
        </Button>
      </div>
    </form>
  );
};

export default CompositeDishManagement;