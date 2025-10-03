import { FormEvent, useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import { DashboardLayout } from "../components/Layout";
import { getCustomers } from "../api/customers";
import { getProducts } from "../api/products";
import { createOrder, deleteOrder, getOrder, listOrders, updateOrder } from "../api/orders";
import type { Customer, Order, Product } from "../types";

function OrdersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [orderLookupId, setOrderLookupId] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderSearchEmail, setOrderSearchEmail] = useState<string>("");
  const [editingQuantitiesBase, setEditingQuantitiesBase] = useState<Record<string, number>>({});

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [customerData, productData] = await Promise.all([getCustomers(), getProducts()]);
        setCustomers(customerData);
        setProducts(productData);
      } catch (err) {
        setCreateError(err instanceof Error ? err.message : "Failed to load data");
      }
    };

    bootstrap();
  }, []);

  const fetchOrders = useCallback(async (email?: string) => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const data = await listOrders(email);
      setOrders(data);
      return data;
    } catch (err) {
      setOrders([]);
      setOrdersError(err instanceof Error ? err.message : "Failed to load orders");
      return [] as Order[];
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!orders.length) {
      if (latestOrder !== null) {
        setLatestOrder(null);
      }
      return;
    }

    if (latestOrder) {
      const match = orders.find((order) => order.id === latestOrder.id);
      if (match && match !== latestOrder) {
        setLatestOrder(match);
      }
      return;
    }

    setLatestOrder(orders[0]);
  }, [latestOrder, orders]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setCreateError(null);

    if (!customerId) {
      setCreateError("Please select a customer");
      return;
    }

    const items = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (items.length === 0) {
      setCreateError("Add at least one product");
      return;
    }

    try {
      const payload = { customerId, items };
      const order = editingOrderId ? await updateOrder(editingOrderId, payload) : await createOrder(payload);
      setLatestOrder(order);
      setLookupError(null);
      await fetchOrders(orderSearchEmail.trim() || undefined);
      setQuantities({});
      const productData = await getProducts();
      setProducts(productData);
      setEditingOrderId(null);
      setEditingQuantitiesBase({});
      setCustomerId("");
      setOrderLookupId("");
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : editingOrderId
            ? "Failed to update order"
            : "Failed to create order"
      );
    }
  };

  const handleLookup = async () => {
    if (!orderLookupId) return;
    setLookupError(null);
    try {
      const order = await getOrder(orderLookupId);
      setLatestOrder(order);
      setEditingOrderId(null);
      setEditingQuantitiesBase({});
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Order not found");
    }
  };

  const handleSearchOrders = async () => {
    const email = orderSearchEmail.trim() || undefined;
    const data = await fetchOrders(email);
    if (!data.length) {
      setLatestOrder(null);
    }
  };

  const handleResetOrders = async () => {
    setOrderSearchEmail("");
    const data = await fetchOrders();
    if (!data.length) {
      setLatestOrder(null);
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrderId(order.id);
    setCustomerId(order.customerId);
    const nextQuantities: Record<string, number> = {};
    const baseQuantities: Record<string, number> = {};
    order.items.forEach((item) => {
      nextQuantities[item.productId] = item.quantity;
      baseQuantities[item.productId] = item.quantity;
    });
    setQuantities(nextQuantities);
    setEditingQuantitiesBase(baseQuantities);
    setOrderLookupId(order.id);
    setCreateError(null);
    setLookupError(null);
  };

  const handleCancelEdit = () => {
    setEditingOrderId(null);
    setCustomerId("");
    setQuantities({});
    setEditingQuantitiesBase({});
    setOrderLookupId("");
    setCreateError(null);
  };

  const handleDeleteOrder = async (orderId: string) => {
    const confirmed = window.confirm("Delete this order? Stock levels will be restored.");
    if (!confirmed) return;

    try {
      await deleteOrder(orderId);
      setLookupError(null);
      setCreateError(null);
      setEditingOrderId(null);
      setEditingQuantitiesBase({});
      const filterEmail = orderSearchEmail.trim() || undefined;
      const data = await fetchOrders(filterEmail);
      if (data.length) {
        setLatestOrder(data[0]);
      } else {
        setLatestOrder(null);
      }
      const productData = await getProducts();
      setProducts(productData);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Failed to delete order");
    }
  };

  const renderOrdersTable = () => {
    if (ordersLoading) {
      return <p>Loading orders...</p>;
    }

    if (ordersError) {
      return <div className="alert">{ordersError}</div>;
    }

    if (!orders.length) {
      return <p>No orders found.</p>;
    }

    return (
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Email</th>
            <th>Date</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              style={{
                cursor: "pointer",
                backgroundColor: latestOrder?.id === order.id ? "#f1f5f9" : undefined
              }}
              onClick={() => {
                setLatestOrder(order);
                setLookupError(null);
              }}
            >
              <td>{order.id}</td>
              <td>{order.customerName}</td>
              <td>{order.customerEmail}</td>
              <td>{dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}</td>
              <td>${order.totalAmount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <DashboardLayout title="Orders">
      <div className="grid two">
        <div className="card">
          <h3>{editingOrderId ? "Update order" : "Create order"}</h3>
          {createError && <div className="alert">{createError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="customer">Customer</label>
              <select
                id="customer"
                required
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Products</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.75rem",
                      border: "1px solid #d9e2ec",
                      borderRadius: "10px"
                    }}
                  >
                    <div>
                      <strong>{product.name}</strong>
                      <div style={{ fontSize: "0.9rem", color: "#52606d" }}>
                        ${product.price.toFixed(2)} · Stock: {product.stock}
                      </div>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={product.stock + (editingOrderId ? editingQuantitiesBase[product.id] ?? 0 : 0)}
                      style={{ width: "5rem" }}
                      value={quantities[product.id] ?? 0}
                      onChange={(event) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [product.id]: Number(event.target.value)
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            <button className="primary-btn" type="submit">
              {editingOrderId ? "Update order" : "Create order"}
            </button>
            {editingOrderId && (
              <button type="button" className="secondary-btn" style={{ marginLeft: "0.5rem" }} onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
          </form>
        </div>
        <div className="card">
          <div className="section-title" style={{ marginBottom: "1rem" }}>
            <h3>Order details</h3>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                placeholder="Order ID"
                value={orderLookupId}
                onChange={(event) => setOrderLookupId(event.target.value)}
              />
              <button type="button" className="secondary-btn" onClick={handleLookup}>
                Find
              </button>
            </div>
          </div>
          {lookupError && <div className="alert">{lookupError}</div>}
          {latestOrder ? (
            <div>
              <p>
                <strong>ID:</strong> {latestOrder.id}
              </p>
              <p>
                <strong>Customer:</strong> {latestOrder.customerName} ({latestOrder.customerEmail})
              </p>
              <p>
                <strong>Date:</strong> {dayjs(latestOrder.createdAt).format("DD/MM/YYYY HH:mm")}
              </p>
              <p>
                <strong>Total:</strong> ${latestOrder.totalAmount.toFixed(2)}
              </p>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit price</th>
                    <th>Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {latestOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.productName}</td>
                      <td>{item.quantity}</td>
                      <td>${item.unitPrice.toFixed(2)}</td>
                      <td>${item.lineTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="button" className="secondary-btn" onClick={() => handleEditOrder(latestOrder)}>
                  Edit order
                </button>
                <button type="button" className="secondary-btn" onClick={() => handleDeleteOrder(latestOrder.id)}>
                  Delete order
                </button>
              </div>
            </div>
          ) : (
            <p>No order selected yet.</p>
          )}
        </div>
      </div>
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <div className="section-title" style={{ marginBottom: "1rem" }}>
          <h3>All orders</h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              placeholder="Customer email"
              value={orderSearchEmail}
              onChange={(event) => setOrderSearchEmail(event.target.value)}
            />
            <button type="button" className="secondary-btn" onClick={handleSearchOrders}>
              Search
            </button>
            <button type="button" className="secondary-btn" onClick={handleResetOrders}>
              Reset
            </button>
          </div>
        </div>
        {renderOrdersTable()}
      </div>
    </DashboardLayout>
  );
}

export default OrdersPage;
