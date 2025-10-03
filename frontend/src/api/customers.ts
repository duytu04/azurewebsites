import apiClient from "./client";
import type { CreateCustomerPayload, Customer, UpdateCustomerPayload } from "../types";

export async function getCustomers(): Promise<Customer[]> {
  const { data } = await apiClient.get<Customer[]>("/api/customers");
  return Array.isArray(data) ? data : [data];
}

export async function findCustomerByEmail(email: string): Promise<Customer | null> {
  try {
    const { data } = await apiClient.get<Customer>("/api/customers", { params: { email } });
    return data ?? null;
  } catch (error) {
    if (typeof error === "object" && error && (error as Record<string, unknown>).hasOwnProperty("response")) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        return null;
      }
    }
    throw error;
  }
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<Customer> {
  const { data } = await apiClient.post<Customer>("/api/customers", payload);
  return data;
}

export async function updateCustomer(id: string, payload: UpdateCustomerPayload): Promise<Customer> {
  const { data } = await apiClient.put<Customer>(`/api/customers/${id}`, payload);
  return data;
}
