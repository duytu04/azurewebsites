import { FormEvent, useEffect, useState } from "react";
import dayjs from "dayjs";
import { isAxiosError } from "axios";
import { DashboardLayout } from "../components/Layout";
import { createCustomer, getCustomers, updateCustomer } from "../api/customers";
import type { Customer } from "../types";

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  const resolveErrorMessage = (err: unknown, fallback: string) => {
    if (isAxiosError<{ message?: string }>(err)) {
      return err.response?.data?.message ?? err.message ?? fallback;
    }
    return err instanceof Error ? err.message : fallback;
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (err) {
        setError(resolveErrorMessage(err, "Failed to load customers"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingCustomerId) {
        const updated = await updateCustomer(editingCustomerId, { fullName, email, phoneNumber });
        setCustomers((prev) => prev.map((customer) => (customer.id === editingCustomerId ? updated : customer)));
        setSuccess("Customer updated successfully");
        setEditingCustomerId(null);
      } else {
        const customer = await createCustomer({ fullName, email, phoneNumber });
        setCustomers((prev) => [customer, ...prev]);
        setSuccess("Customer created successfully");
      }

      setFullName("");
      setEmail("");
      setPhoneNumber("");
    } catch (err) {
      setError(resolveErrorMessage(err, editingCustomerId ? "Failed to update customer" : "Failed to create customer"));
    }
  };

  const handleEdit = (customer: Customer) => {
    setFullName(customer.fullName);
    setEmail(customer.email);
    setPhoneNumber(customer.phoneNumber ?? "");
    setEditingCustomerId(customer.id);
    setSuccess(null);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingCustomerId(null);
    setFullName("");
    setEmail("");
    setPhoneNumber("");
    setSuccess(null);
    setError(null);
  };

  return (
    <DashboardLayout title="Customers">
      <div className="grid two">
        <div className="card">
          <h3>Add customer</h3>
          {error && <div className="alert">{error}</div>}
          {success && <div className="alert success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="customer-name">Full name</label>
              <input
                id="customer-name"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="customer-email">Email</label>
              <input
                id="customer-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="customer-phone">Phone number</label>
              <input
                id="customer-phone"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
              />
            </div>
            <button className="primary-btn" type="submit">
              {editingCustomerId ? "Update customer" : "Create customer"}
            </button>
            {editingCustomerId && (
              <button type="button" className="secondary-btn" style={{ marginLeft: "0.5rem" }} onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
          </form>
        </div>
        <div className="card">
          <h3>All customers</h3>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.fullName}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phoneNumber ?? "-"}</td>
                    <td>{dayjs(customer.createdAt).format("DD/MM/YYYY HH:mm")}</td>
                    <td>
                      <button type="button" className="secondary-btn" onClick={() => handleEdit(customer)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default CustomersPage;
