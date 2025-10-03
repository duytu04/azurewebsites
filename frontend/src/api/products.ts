import apiClient from "./client";
import type { CreateProductPayload, Product, UpdateProductPayload, UpdateStockPayload } from "../types";

export async function getProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>("/api/products");
  return data;
}

export async function createProduct(payload: CreateProductPayload): Promise<Product> {
  const { data } = await apiClient.post<Product>("/api/products", payload);
  return data;
}

export async function updateProductStock(id: string, payload: UpdateStockPayload): Promise<Product> {
  const { data } = await apiClient.put<Product>(`/api/products/${id}/stock`, payload);
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/api/products/${id}`);
}

export async function updateProduct(id: string, payload: UpdateProductPayload): Promise<Product> {
  const { data } = await apiClient.put<Product>(`/api/products/${id}`, payload);
  return data;
}
