export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      composite_dishes: {
        Row: {
          base_price: number
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          preparation_time: string | null
          updated_at: string
        }
        Insert: {
          base_price?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          preparation_time?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          preparation_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "composite_dishes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_addresses: {
        Row: {
          city: string
          created_at: string
          id: string
          is_default: boolean | null
          postal_code: string | null
          street_address: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          postal_code?: string | null
          street_address: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          postal_code?: string | null
          street_address?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_confirmations: {
        Row: {
          confirmation_data: string | null
          confirmation_type: string
          confirmed_at: string
          created_at: string
          delivery_issues: string | null
          delivery_notes: string | null
          driver_id: string
          id: string
          order_id: string
        }
        Insert: {
          confirmation_data?: string | null
          confirmation_type: string
          confirmed_at?: string
          created_at?: string
          delivery_issues?: string | null
          delivery_notes?: string | null
          driver_id: string
          id?: string
          order_id: string
        }
        Update: {
          confirmation_data?: string | null
          confirmation_type?: string
          confirmed_at?: string
          created_at?: string
          delivery_issues?: string | null
          delivery_notes?: string | null
          driver_id?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_confirmations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_confirmations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_drivers: {
        Row: {
          created_at: string
          current_orders_count: number | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          is_available: boolean | null
          license_plate: string | null
          max_concurrent_orders: number | null
          phone: string
          rating: number | null
          updated_at: string
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          current_orders_count?: number | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          license_plate?: string | null
          max_concurrent_orders?: number | null
          phone: string
          rating?: number | null
          updated_at?: string
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          current_orders_count?: number | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          license_plate?: string | null
          max_concurrent_orders?: number | null
          phone?: string
          rating?: number | null
          updated_at?: string
          vehicle_type?: string | null
        }
        Relationships: []
      }
      dish_base_products: {
        Row: {
          created_at: string
          dish_id: string
          id: string
          menu_item_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          dish_id: string
          id?: string
          menu_item_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          dish_id?: string
          id?: string
          menu_item_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "dish_base_products_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "composite_dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_base_products_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_optional_elements: {
        Row: {
          additional_price: number | null
          created_at: string
          dish_id: string
          element_type: string | null
          id: string
          is_included_by_default: boolean | null
          menu_item_id: string
        }
        Insert: {
          additional_price?: number | null
          created_at?: string
          dish_id: string
          element_type?: string | null
          id?: string
          is_included_by_default?: boolean | null
          menu_item_id: string
        }
        Update: {
          additional_price?: number | null
          created_at?: string
          dish_id?: string
          element_type?: string | null
          id?: string
          is_included_by_default?: boolean | null
          menu_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dish_optional_elements_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "composite_dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_optional_elements_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_replacement_options: {
        Row: {
          created_at: string
          id: string
          optional_element_id: string
          price_difference: number | null
          replacement_item_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          optional_element_id: string
          price_difference?: number | null
          replacement_item_id: string
        }
        Update: {
          created_at?: string
          id?: string
          optional_element_id?: string
          price_difference?: number | null
          replacement_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dish_replacement_options_optional_element_id_fkey"
            columns: ["optional_element_id"]
            isOneToOne: false
            referencedRelation: "dish_optional_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_replacement_options_replacement_item_id_fkey"
            columns: ["replacement_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          accuracy: number | null
          created_at: string
          driver_id: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          order_id: string | null
          speed: number | null
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          driver_id: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          order_id?: string | null
          speed?: number | null
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          driver_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          order_id?: string | null
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_notifications: {
        Row: {
          created_at: string
          driver_id: string
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          order_id: string
          responded_at: string | null
          response: string | null
          title: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type?: string
          order_id: string
          responded_at?: string | null
          response?: string | null
          title: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          order_id?: string
          responded_at?: string | null
          response?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_notifications_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_stats: {
        Row: {
          average_delivery_time: number | null
          created_at: string
          customer_rating: number | null
          date: string
          driver_id: string
          id: string
          total_deliveries: number | null
          total_distance: number | null
          total_earnings: number | null
          updated_at: string
        }
        Insert: {
          average_delivery_time?: number | null
          created_at?: string
          customer_rating?: number | null
          date: string
          driver_id: string
          id?: string
          total_deliveries?: number | null
          total_distance?: number | null
          total_earnings?: number | null
          updated_at?: string
        }
        Update: {
          average_delivery_time?: number | null
          created_at?: string
          customer_rating?: number | null
          date?: string
          driver_id?: string
          id?: string
          total_deliveries?: number | null
          total_distance?: number | null
          total_earnings?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_stats_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          created_at: string
          date: string
          id: string
          updated_at: string
          usd_to_ves_rate: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          updated_at?: string
          usd_to_ves_rate: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          usd_to_ves_rate?: number
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string
          current_stock: number
          id: string
          last_restocked_at: string | null
          max_stock: number | null
          menu_item_id: string | null
          min_stock_alert: number | null
          supplier_info: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_stock?: number
          id?: string
          last_restocked_at?: string | null
          max_stock?: number | null
          menu_item_id?: string | null
          min_stock_alert?: number | null
          supplier_info?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_stock?: number
          id?: string
          last_restocked_at?: string | null
          max_stock?: number | null
          menu_item_id?: string | null
          min_stock_alert?: number | null
          supplier_info?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_payment_verifications: {
        Row: {
          amount_paid: number
          created_at: string
          id: string
          order_id: string
          origin_bank: string
          payment_method_type: string
          payment_proof_url: string
          phone_number_used: string | null
          reference_number: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          id?: string
          order_id: string
          origin_bank: string
          payment_method_type: string
          payment_proof_url: string
          phone_number_used?: string | null
          reference_number: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: string
          order_id?: string
          origin_bank?: string
          payment_method_type?: string
          payment_proof_url?: string
          phone_number_used?: string | null
          reference_number?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_payment_verifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          preparation_time: string | null
          price: number
          rating: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          preparation_time?: string | null
          price: number
          rating?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          preparation_time?: string | null
          price?: number
          rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_assignments: {
        Row: {
          actual_distance: number | null
          assigned_at: string | null
          assignment_type: string | null
          created_at: string
          delivered_at: string | null
          driver_id: string | null
          estimated_delivery_time: string | null
          estimated_pickup_time: string | null
          external_tracking_id: string | null
          id: string
          order_id: string | null
          picked_up_at: string | null
        }
        Insert: {
          actual_distance?: number | null
          assigned_at?: string | null
          assignment_type?: string | null
          created_at?: string
          delivered_at?: string | null
          driver_id?: string | null
          estimated_delivery_time?: string | null
          estimated_pickup_time?: string | null
          external_tracking_id?: string | null
          id?: string
          order_id?: string | null
          picked_up_at?: string | null
        }
        Update: {
          actual_distance?: number | null
          assigned_at?: string | null
          assignment_type?: string | null
          created_at?: string
          delivered_at?: string | null
          driver_id?: string | null
          estimated_delivery_time?: string | null
          estimated_pickup_time?: string | null
          external_tracking_id?: string | null
          id?: string
          order_id?: string | null
          picked_up_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_dish_customizations: {
        Row: {
          created_at: string
          id: string
          is_included: boolean | null
          optional_element_id: string
          order_item_id: string
          price_adjustment: number | null
          replacement_item_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_included?: boolean | null
          optional_element_id: string
          order_item_id: string
          price_adjustment?: number | null
          replacement_item_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_included?: boolean | null
          optional_element_id?: string
          order_item_id?: string
          price_adjustment?: number | null
          replacement_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_dish_customizations_optional_element_id_fkey"
            columns: ["optional_element_id"]
            isOneToOne: false
            referencedRelation: "dish_optional_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_dish_customizations_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_dish_customizations_replacement_item_id_fkey"
            columns: ["replacement_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          composite_dish_id: string | null
          created_at: string
          id: string
          menu_item_id: string | null
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          composite_dish_id?: string | null
          created_at?: string
          id?: string
          menu_item_id?: string | null
          order_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          composite_dish_id?: string | null
          created_at?: string
          id?: string
          menu_item_id?: string | null
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_composite_dish_id_fkey"
            columns: ["composite_dish_id"]
            isOneToOne: false
            referencedRelation: "composite_dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_promotions: {
        Row: {
          created_at: string
          discount_applied: number
          id: string
          order_id: string | null
          promotion_id: string | null
        }
        Insert: {
          created_at?: string
          discount_applied: number
          id?: string
          order_id?: string | null
          promotion_id?: string | null
        }
        Update: {
          created_at?: string
          discount_applied?: number
          id?: string
          order_id?: string | null
          promotion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_promotions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_promotions_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_address_id: string | null
          delivery_code: string | null
          delivery_fee: number | null
          driver_earnings: number | null
          estimated_delivery_time: number | null
          id: string
          notes: string | null
          pickup_time: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_address_id?: string | null
          delivery_code?: string | null
          delivery_fee?: number | null
          driver_earnings?: number | null
          estimated_delivery_time?: number | null
          id?: string
          notes?: string | null
          pickup_time?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_address_id?: string | null
          delivery_code?: string | null
          delivery_fee?: number | null
          driver_earnings?: number | null
          estimated_delivery_time?: number | null
          id?: string
          notes?: string | null
          pickup_time?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "delivery_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_holder_name: string | null
          account_number: string
          created_at: string
          destination_bank: string
          id: string
          is_active: boolean | null
          other_type_description: string | null
          owner_id: string
          payment_type: string
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          account_holder_name?: string | null
          account_number: string
          created_at?: string
          destination_bank: string
          id?: string
          is_active?: boolean | null
          other_type_description?: string | null
          owner_id: string
          payment_type: string
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string
          created_at?: string
          destination_bank?: string
          id?: string
          is_active?: boolean | null
          other_type_description?: string | null
          owner_id?: string
          payment_type?: string
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          applicable_items: string[] | null
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_order_amount: number | null
          name: string
          promo_code: string | null
          start_date: string
          updated_at: string
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          applicable_items?: string[] | null
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          name: string
          promo_code?: string | null
          start_date: string
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          applicable_items?: string[] | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          name?: string
          promo_code?: string | null
          start_date?: string
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: []
      }
      restaurant_tables: {
        Row: {
          capacity: number
          created_at: string
          id: string
          status: string
          table_number: string
          updated_at: string
          zone: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          status?: string
          table_number: string
          updated_at?: string
          zone?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          status?: string
          table_number?: string
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_delivery_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_sales_stats: {
        Args: { start_date?: string; end_date?: string }
        Returns: {
          total_orders: number
          total_revenue: number
          avg_order_value: number
          top_selling_items: Json
          peak_hours: Json
          daily_sales: Json
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "restaurant" | "cliente" | "delivery" | "mesero"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "delivered"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["restaurant", "cliente", "delivery", "mesero"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
