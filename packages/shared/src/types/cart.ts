export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  variant_label: string | null;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  full_name: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  notes?: string;
}

export interface CartSummary {
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  item_count: number;
}
