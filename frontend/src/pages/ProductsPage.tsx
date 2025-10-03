import { FormEvent, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import dayjs from "dayjs";
import { DashboardLayout } from "../components/Layout";
import { createProduct, deleteProduct, getProducts, updateProduct, updateProductStock } from "../api/products";
import type { Product } from "../types";

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [errors, setErrors] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stockChanges, setStockChanges] = useState<Record<string, number>>({});
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const resolveErrorMessage = (error: unknown, fallback: string) => {
    if (isAxiosError<{ message?: string }>(error)) {
      return error.response?.data?.message ?? error.message ?? fallback;
    }
    return error instanceof Error ? error.message : fallback;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        setErrors(resolveErrorMessage(err, "Failed to load products"));
      }
    };

    fetchProducts();
  }, []);

  const handleCreateProduct = async (event: FormEvent) => {
    event.preventDefault();
    setErrors(null);
    setSuccess(null);

    try {
      if (editingProductId) {
        const updated = await updateProduct(editingProductId, { name, description, price });
        setProducts((prev) => prev.map((product) => (product.id === editingProductId ? updated : product)));
        setSuccess("Product updated successfully");
        setEditingProductId(null);
      } else {
        const product = await createProduct({ name, description, price, stock });
        setProducts((prev) => [product, ...prev]);
        setSuccess("Product created successfully");
      }

      setName("");
      setDescription("");
      setPrice(0);
      setStock(0);
    } catch (err) {
      setErrors(resolveErrorMessage(err, editingProductId ? "Failed to update product" : "Failed to create product"));
    }
  };

  const handleStockUpdate = async (productId: string) => {
    const amount = stockChanges[productId];
    if (!amount) return;

    try {
      const updated = await updateProductStock(productId, { amount });
      setProducts((prev) => prev.map((product) => (product.id === productId ? updated : product)));
      setStockChanges((prev) => ({ ...prev, [productId]: 0 }));
    } catch (err) {
      setErrors(resolveErrorMessage(err, "Failed to update stock"));
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    const confirmed = window.confirm(`Delete product "${productName}"? This action cannot be undone.`);
    if (!confirmed) return;

    setErrors(null);
    setSuccess(null);

    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((product) => product.id !== productId));
      setStockChanges((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      setSuccess("Product deleted successfully");
    } catch (err) {
      setErrors(resolveErrorMessage(err, "Failed to delete product"));
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setName(product.name);
    setDescription(product.description ?? "");
    setPrice(product.price);
    setStock(product.stock);
    setErrors(null);
    setSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setName("");
    setDescription("");
    setPrice(0);
    setStock(0);
    setErrors(null);
    setSuccess(null);
  };

  return (
    <DashboardLayout title="Products">
      <div className="grid two">
        <div className="card">
          <h3>Add product</h3>
          {errors && <div className="alert">{errors}</div>}
          {success && <div className="alert success">{success}</div>}
          <form onSubmit={handleCreateProduct}>
            <div className="form-field">
              <label htmlFor="product-name">Name</label>
              <input
                id="product-name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="product-description">Description</label>
              <textarea
                id="product-description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="product-price">Price</label>
              <input
                id="product-price"
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(event) => setPrice(Number(event.target.value))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="product-stock">Initial stock</label>
              <input
                id="product-stock"
                type="number"
                min="0"
                required={!editingProductId}
                value={stock}
                onChange={(event) => setStock(Number(event.target.value))}
                disabled={Boolean(editingProductId)}
              />
            </div>
            <button className="primary-btn" type="submit">
              {editingProductId ? "Update product" : "Create product"}
            </button>
            {editingProductId && (
              <button type="button" className="secondary-btn" style={{ marginLeft: "0.5rem" }} onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
          </form>
        </div>
        <div className="card">
          <h3>Inventory</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Updated</th>
                <th>Adjust</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{product.stock}</td>
                  <td>{product.updatedAt ? dayjs(product.updatedAt).format("DD/MM/YYYY HH:mm") : "-"}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input
                        type="number"
                        style={{ width: "6rem" }}
                        value={stockChanges[product.id] ?? 0}
                        onChange={(event) =>
                          setStockChanges((prev) => ({ ...prev, [product.id]: Number(event.target.value) }))
                        }
                      />
                      <button type="button" className="secondary-btn" onClick={() => handleStockUpdate(product.id)}>
                        Update
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button type="button" className="secondary-btn" onClick={() => handleEditProduct(product)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ProductsPage;
