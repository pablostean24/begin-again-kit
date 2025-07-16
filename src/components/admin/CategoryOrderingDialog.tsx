import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { GripVertical } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type MenuCategory = Tables<'menu_categories'> & {
  menu_items: Tables<'menu_items'>[];
};

interface CategoryOrderingDialogProps {
  categories: MenuCategory[];
  isOpen: boolean;
  onClose: () => void;
}

const CategoryOrderingDialog = ({ categories, isOpen, onClose }: CategoryOrderingDialogProps) => {
  const queryClient = useQueryClient();
  const [orderedCategories, setOrderedCategories] = useState(() => 
    [...categories].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  );

  const updateCategoryOrder = useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      // Update each category individually
      for (const update of updates) {
        const { error } = await supabase
          .from('menu_categories')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Orden de categorías actualizado');
      onClose();
    },
    onError: (error) => {
      toast.error('Error al actualizar orden: ' + error.message);
    }
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(orderedCategories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedCategories(items);
  };

  const handleSaveOrder = () => {
    const updates = orderedCategories.map((category, index) => ({
      id: category.id,
      display_order: index + 1
    }));

    updateCategoryOrder.mutate(updates);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ordenar Categorías del Menú</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Arrastra las categorías para cambiar su orden en el menú
          </p>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {orderedCategories.map((category, index) => (
                    <Draggable key={category.id} draggableId={category.id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`${snapshot.isDragging ? 'shadow-lg' : ''}`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="h-4 w-4 text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{category.name}</div>
                                <div className="text-sm text-gray-500">
                                  {category.menu_items?.length || 0} productos
                                </div>
                              </div>
                              <div className="text-sm text-gray-400">
                                #{index + 1}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveOrder} 
              className="flex-1"
              disabled={updateCategoryOrder.isPending}
            >
              {updateCategoryOrder.isPending ? 'Guardando...' : 'Guardar Orden'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryOrderingDialog;
