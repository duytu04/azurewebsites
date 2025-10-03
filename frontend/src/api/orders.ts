import apiClient from "./client";
import type { CreateOrderPayload, Order, UpdateOrderPayload } from "../types";

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await apiClient.post<Order>("/api/orders", payload);
  return data;
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/api/orders/${id}`);
  return data;
}

export async function listOrders(customerEmail?: string): Promise<Order[]> {
  const { data } = await apiClient.get<Order[]>("/api/orders", {
    params: customerEmail ? { customerEmail } : undefined
  });
  return data;
}

export async function updateOrder(id: string, payload: UpdateOrderPayload): Promise<Order> {
  const { data } = await apiClient.put<Order>(`/api/orders/${id}`, payload);
  return data;
}

export async function deleteOrder(id: string): Promise<void> {
  await apiClient.delete(`/api/orders/${id}`);
}
