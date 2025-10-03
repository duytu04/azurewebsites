export interface AuthResponse {
  token: string;
  expiresAt: string;
  email: string;
  fullName: string;
  role: string;
}

export interface UserProfile {
  email: string;
  fullName: string;
  role: string;
  expiresAt: string;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  createdAt: string;
}

export interface CreateCustomerPayload {
  fullName: string;
  email: string;
  phoneNumber?: string;
}

export interface UpdateCustomerPayload extends CreateCustomerPayload {}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  stock: number;
}

export interface UpdateProductPayload {
  name: string;
  description?: string;
  price: number;
}

export interface UpdateStockPayload {
  amount: number;
}

export interface OrderItemPayload {
  productId: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  totalAmount: number;
  items: OrderItem[];
}

export interface CreateOrderPayload {
  customerId: string;
  items: OrderItemPayload[];
}

export interface UpdateOrderPayload extends CreateOrderPayload {}
