export interface InventoryResponse {
  id: string;
  item: string;
  name: string;
  model: string;
  serial_number: string;
  finality: string;
  acquisition_price: number;
  freight: number;
  residual_value: number;
  depreciated_value: number;
  service_life: number;
  image_url: string;
  supplier_id: string;
  acquisition_date: string;
  location_id: string;
  user_id: string;
  created_at: string;
  category_id: string;
  description: string;
  locale_id: string;
  subcategory_id: string;
  status: "STANDBY" | "IN_USE" | "MAINTENANCE" | "DISCARDED" | "LOST";
  sector_id: string | null;
  location: {
    id: string;
    name: string;
    address: string;
    branch: string;
    user_id: string;
    created_at: string;
  };
  locale: {
    id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
    location_id: string;
  };
  supplier: {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    cnpj: string;
    contact_person: string;
    created_at: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    created_at: string;
    updated_at: string;
    role: string;
    sector_id: string | null;
  };
  category: {
    id: string;
    value: string;
    label: string;
    created_at: string;
    updated_at: string;
  };
  subcategory: {
    id: string;
    value: string;
    label: string;
    category_id: string;
    created_at: string;
    updated_at: string;
  };
}

export interface RateLimitResponse {
  status: number;
  message: string;
}
