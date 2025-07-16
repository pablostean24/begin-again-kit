
import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserCreateData {
  email: string;
  password: string;
  full_name: string;
  role: AppRole;
}

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

const UserCreateDialog = ({ open, onOpenChange, onUserCreated }: UserCreateDialogProps) => {
  const { toast } = useToast();
  const form = useForm<UserCreateData>({
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      role: 'cliente',
    },
  });

  const onSubmit = async (data: UserCreateData) => {
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "No estás autenticado",
          variant: "destructive",
        });
        return;
      }

      // Call the Edge Function to create the user
      const { data: result, error } = await supabase.functions.invoke('create-user', {
        body: data,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Error",
          description: `No se pudo crear el usuario: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (result.error) {
        toast({
          title: "Error",
          description: `No se pudo crear el usuario: ${result.error}`,
          variant: "destructive",
        });
        return;
      }

      if (result.warning) {
        toast({
          title: "Advertencia",
          description: result.warning,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Usuario creado correctamente",
        });
      }

      form.reset();
      onOpenChange(false);
      onUserCreated();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Error al crear usuario",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              rules={{ required: "El nombre completo es requerido" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              rules={{
                required: "El correo electrónico es requerido",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Correo electrónico inválido"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              rules={{
                required: "La contraseña es requerida",
                minLength: {
                  value: 6,
                  message: "La contraseña debe tener al menos 6 caracteres"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              rules={{ required: "El rol es requerido" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="restaurant">Restaurante</SelectItem>
                      <SelectItem value="delivery">Repartidor</SelectItem>
                      <SelectItem value="mesero">Mesero</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="flex-1"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserCreateDialog;
