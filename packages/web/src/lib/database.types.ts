export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      bank_transfer_settings: {
        Row: {
          alias: string
          banco: string
          cbu: string
          extra_info: string
          id: boolean
          titular: string
          updated_at: string
        }
        Insert: {
          alias?: string
          banco?: string
          cbu?: string
          extra_info?: string
          id?: boolean
          titular?: string
          updated_at?: string
        }
        Update: {
          alias?: string
          banco?: string
          cbu?: string
          extra_info?: string
          id?: boolean
          titular?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          updated_at?: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "discounted_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string
          id: string
          movement_date: string
          reference_id: string | null
          reference_type: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          movement_date?: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          movement_date?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: Json | null
          created_at: string
          first_name: string
          full_name: string | null
          id: string
          last_name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: Json | null
          created_at?: string
          first_name?: string
          full_name?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: Json | null
          created_at?: string
          first_name?: string
          full_name?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          id: string
          receipt_url: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
        }
        Relationships: []
      }
      in_person_customers: {
        Row: {
          address: string | null
          balance: number
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          balance?: number
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          balance?: number
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      in_person_sale_items: {
        Row: {
          discount: number
          id: string
          product_id: string
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          discount?: number
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          discount?: number
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          subtotal?: number
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "in_person_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "discounted_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "in_person_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "in_person_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "in_person_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "in_person_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "in_person_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "in_person_sale_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      in_person_sales: {
        Row: {
          amount_paid: number
          balance_used: number
          created_at: string
          created_by: string | null
          customer_id: string | null
          discount: number
          id: string
          notes: string | null
          payment_method: string
          total: number
        }
        Insert: {
          amount_paid: number
          balance_used?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          payment_method: string
          total: number
        }
        Update: {
          amount_paid?: number
          balance_used?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "in_person_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "in_person_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          created_at: string
          customer_id: string
          id: string
          is_read: boolean
          order_id: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_read?: boolean
          order_id?: string | null
          title: string
          type?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_read?: boolean
          order_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          channel: string
          created_at: string
          error_message: string | null
          event: string
          id: string
          order_id: string | null
          provider_message_id: string | null
          provider_response: Json | null
          recipient: string | null
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          error_message?: string | null
          event: string
          id?: string
          order_id?: string | null
          provider_message_id?: string | null
          provider_response?: Json | null
          recipient?: string | null
          status: string
        }
        Update: {
          channel?: string
          created_at?: string
          error_message?: string | null
          event?: string
          id?: string
          order_id?: string | null
          provider_message_id?: string | null
          provider_response?: Json | null
          recipient?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          subtotal: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          subtotal: number
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "discounted_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          customer_name: string | null
          discount: number
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string
          shipping_address: Json | null
          shipping_cost: number
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
          whatsapp_pending_notification_attempted_at: string | null
          whatsapp_pending_notification_error: string | null
          whatsapp_pending_notification_status: string
          whatsapp_pending_notified_at: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          customer_name?: string | null
          discount?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          shipping_address?: Json | null
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at?: string
          whatsapp_pending_notification_attempted_at?: string | null
          whatsapp_pending_notification_error?: string | null
          whatsapp_pending_notification_status?: string
          whatsapp_pending_notified_at?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          customer_name?: string | null
          discount?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          shipping_address?: Json | null
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          whatsapp_pending_notification_attempted_at?: string | null
          whatsapp_pending_notification_error?: string | null
          whatsapp_pending_notification_status?: string
          whatsapp_pending_notified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_questions: {
        Row: {
          answer_text: string | null
          answered_at: string | null
          answered_by: string | null
          created_at: string
          customer_id: string | null
          customer_name: string | null
          id: string
          is_visible: boolean
          product_id: string
          question_text: string
          session_id: string | null
          updated_at: string
        }
        Insert: {
          answer_text?: string | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          is_visible?: boolean
          product_id: string
          question_text: string
          session_id?: string | null
          updated_at?: string
        }
        Update: {
          answer_text?: string | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          is_visible?: boolean
          product_id?: string
          question_text?: string
          session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_questions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_questions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_questions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "discounted_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_questions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_questions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_questions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "top_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_suppliers: {
        Row: {
          created_at: string
          product_id: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_suppliers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "discounted_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_suppliers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_suppliers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_suppliers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color: string | null
          created_at: string
          discount: number
          id: string
          product_id: string
          size: string | null
          sku: string | null
          stock: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          discount?: number
          id?: string
          product_id: string
          size?: string | null
          sku?: string | null
          stock?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          discount?: number
          id?: string
          product_id?: string
          size?: string | null
          sku?: string | null
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "discounted_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "top_products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          cost: number | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean
          name: string
          pack_units: number | null
          price: number
          slug: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category_id: string
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          name: string
          pack_units?: number | null
          price: number
          slug: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          name?: string
          pack_units?: number | null
          price?: number
          slug?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          id: string
          product_id: string
          purchase_id: string
          quantity: number
          subtotal: number
          unit_cost: number
          variant_id: string | null
        }
        Insert: {
          id?: string
          product_id: string
          purchase_id: string
          quantity: number
          subtotal: number
          unit_cost: number
          variant_id?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          purchase_id?: string
          quantity?: number
          subtotal?: number
          unit_cost?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "discounted_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          id: string
          invoice_number: string | null
          notes: string | null
          purchase_date: string
          supplier_name: string
          total: number
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          purchase_date?: string
          supplier_name: string
          total: number
        }
        Update: {
          created_at?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          purchase_date?: string
          supplier_name?: string
          total?: number
        }
        Relationships: []
      }
      shipping_settings: {
        Row: {
          free_shipping_min: number
          id: boolean
          shipping_cost: number
          updated_at: string
        }
        Insert: {
          free_shipping_min?: number
          id?: boolean
          shipping_cost?: number
          updated_at?: string
        }
        Update: {
          free_shipping_min?: number
          id?: boolean
          shipping_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          instagram: string | null
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      customer_summary: {
        Row: {
          customer_since: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          last_order_date: string | null
          phone: string | null
          total_orders: number | null
          total_spent: number | null
        }
        Relationships: []
      }
      daily_sales: {
        Row: {
          day: string | null
          revenue: number | null
          total_orders: number | null
          unique_customers: number | null
        }
        Relationships: []
      }
      discounted_products: {
        Row: {
          category_id: string | null
          compare_price: number | null
          created_at: string | null
          description: string | null
          effective_price: number | null
          id: string | null
          images: string[] | null
          is_active: boolean | null
          max_discount: number | null
          name: string | null
          price: number | null
          slug: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      low_stock: {
        Row: {
          color: string | null
          product_name: string | null
          size: string | null
          stock: number | null
        }
        Relationships: []
      }
      monthly_sales: {
        Row: {
          avg_ticket: number | null
          month: string | null
          revenue: number | null
          total_orders: number | null
        }
        Relationships: []
      }
      product_profitability: {
        Row: {
          estimated_cogs: number | null
          gross_profit: number | null
          id: string | null
          margin_percent: number | null
          name: string | null
          price: number | null
          total_revenue: number | null
          units_sold: number | null
        }
        Relationships: []
      }
      top_products: {
        Row: {
          id: string | null
          name: string | null
          order_count: number | null
          price: number | null
          total_revenue: number | null
          units_sold: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_create_cash_movement: {
        Args: {
          p_amount: number
          p_description: string
          p_reference_id: string
          p_reference_type: string
          p_type: string
        }
        Returns: undefined
      }
      create_order_from_cart: {
        Args: { p_payment_method: string; p_shipping_address: Json }
        Returns: string
      }
      ensure_storage_buckets: { Args: never; Returns: undefined }
      gen_variant_sku: {
        Args: { p_color: string; p_product_id: string; p_size: string }
        Returns: string
      }
      get_admin_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      remove_admin_role: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      set_admin_role: { Args: { target_user_id: string }; Returns: undefined }
      update_stock_from_purchase: {
        Args: { p_purchase_id: string }
        Returns: undefined
      }
      variant_sku_base: {
        Args: { p_color: string; p_product_id: string; p_size: string }
        Returns: string
      }
    }
    Enums: {
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
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
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
