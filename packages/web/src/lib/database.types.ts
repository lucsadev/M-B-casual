/**
 * Database type definitions for Supabase client.
 *
 * Maps Postgres tables to their TypeScript row types.
 * Generated types should replace this file when `supabase gen types`
 * is run against the production database.
 *
 * For now, these are manually aligned with the SQL schema
 * and the @mbt/shared type interfaces.
 */

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          compare_price: number | null;
          images: string[];
          tags: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          compare_price?: number | null;
          images?: string[];
          tags?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          compare_price?: number | null;
          images?: string[];
          tags?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          size: string | null;
          color: string | null;
          color_hex: string | null;
          discount: number;
          stock: number;
          sku: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          size?: string | null;
          color?: string | null;
          color_hex?: string | null;
          discount?: number;
          stock?: number;
          sku?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          size?: string | null;
          color?: string | null;
          color_hex?: string | null;
          discount?: number;
          stock?: number;
          sku?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'discounted_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_profitability';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'top_products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_questions: {
        Row: {
          id: string;
          product_id: string;
          customer_id: string | null;
          customer_name: string | null;
          question_text: string;
          answer_text: string | null;
          answered_by: string | null;
          answered_at: string | null;
          is_visible: boolean;
          session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          customer_id?: string | null;
          customer_name?: string | null;
          question_text: string;
          answer_text?: string | null;
          answered_by?: string | null;
          answered_at?: string | null;
          is_visible?: boolean;
          session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          customer_id?: string | null;
          customer_name?: string | null;
          question_text?: string;
          answer_text?: string | null;
          answered_by?: string | null;
          answered_at?: string | null;
          is_visible?: boolean;
          session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_questions_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customer_summary';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_questions_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_questions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'discounted_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_questions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_profitability';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_questions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_questions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'top_products';
            referencedColumns: ['id'];
          },
        ];
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          variant_id?: string | null;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cart_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'discounted_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_profitability';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'top_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          address: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          address?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          address?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          status: string;
          total: number;
          shipping_cost: number;
          discount: number;
          payment_method: string | null;
          payment_status: string;
          notes: string | null;
          shipping_address: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          status?: string;
          total: number;
          shipping_cost?: number;
          discount?: number;
          payment_method?: string | null;
          payment_status?: string;
          notes?: string | null;
          shipping_address?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          status?: string;
          total?: number;
          shipping_cost?: number;
          discount?: number;
          payment_method?: string | null;
          payment_status?: string;
          notes?: string | null;
          shipping_address?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          variant_id?: string | null;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'discounted_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_profitability';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'top_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      purchases: {
        Row: {
          id: string;
          supplier_name: string;
          invoice_number: string | null;
          total: number;
          notes: string | null;
          purchase_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          supplier_name: string;
          invoice_number?: string | null;
          total: number;
          notes?: string | null;
          purchase_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          supplier_name?: string;
          invoice_number?: string | null;
          total?: number;
          notes?: string | null;
          purchase_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      purchase_items: {
        Row: {
          id: string;
          purchase_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          unit_cost: number;
          subtotal: number;
        };
        Insert: {
          id?: string;
          purchase_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity: number;
          unit_cost: number;
          subtotal: number;
        };
        Update: {
          id?: string;
          purchase_id?: string;
          product_id?: string;
          variant_id?: string | null;
          quantity?: number;
          unit_cost?: number;
          subtotal?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'purchase_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'discounted_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_profitability';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'top_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_items_purchase_id_fkey';
            columns: ['purchase_id'];
            isOneToOne: false;
            referencedRelation: 'purchases';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          description: string;
          amount: number;
          category: string;
          expense_date: string;
          receipt_url: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          description: string;
          amount: number;
          category: string;
          expense_date?: string;
          receipt_url?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          description?: string;
          amount?: number;
          category?: string;
          expense_date?: string;
          receipt_url?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          customer_id: string;
          order_id: string | null;
          type: string;
          title: string;
          body: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          order_id?: string | null;
          type?: string;
          title: string;
          body?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          order_id?: string | null;
          type?: string;
          title?: string;
          body?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customer_summary';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      cash_movements: {
        Row: {
          id: string;
          type: string;
          amount: number;
          description: string;
          reference_type: string | null;
          reference_id: string | null;
          movement_date: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          amount: number;
          description: string;
          reference_type?: string | null;
          reference_id?: string | null;
          movement_date?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          amount?: number;
          description?: string;
          reference_type?: string | null;
          reference_id?: string | null;
          movement_date?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      monthly_sales: {
        Row: {
          month: string;
          total_orders: number;
          revenue: number;
          avg_ticket: number;
        };
        Relationships: [];
      };
      low_stock: {
        Row: {
          product_name: string;
          size: string | null;
          color: string | null;
          stock: number;
        };
        Relationships: [];
      };
      daily_sales: {
        Row: {
          day: string;
          total_orders: number;
          revenue: number;
          unique_customers: number;
        };
        Relationships: [];
      };
      top_products: {
        Row: {
          id: string;
          name: string;
          price: number;
          units_sold: number;
          order_count: number;
          total_revenue: number;
        };
        Relationships: [];
      };
      product_profitability: {
        Row: {
          id: string;
          name: string;
          price: number;
          units_sold: number;
          total_revenue: number;
          estimated_cogs: number;
          margin_percent: number;
          gross_profit: number;
        };
        Relationships: [];
      };
      customer_summary: {
        Row: {
          id: string;
          first_name: string;
          last_name: string | null;
          phone: string | null;
          customer_since: string;
          total_orders: number;
          total_spent: number;
          last_order_date: string | null;
        };
        Relationships: [];
      };
      discounted_products: {
        Row: {
          id: string | null;
          category_id: string | null;
          name: string | null;
          slug: string | null;
          description: string | null;
          price: number | null;
          compare_price: number | null;
          images: string[] | null;
          tags: string[] | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          effective_price: number | null;
          max_discount: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      set_admin_role: {
        Args: { target_user_id: string };
        Returns: void;
      };
      remove_admin_role: {
        Args: { target_user_id: string };
        Returns: void;
      };
      get_admin_users: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          email: string;
          created_at: string;
        }[];
      };
      ensure_storage_buckets: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: {
      order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    };
  };
}
