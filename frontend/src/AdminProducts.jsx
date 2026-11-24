
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CakeSlice,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  RefreshCw,
  X
} from "lucide-react";
import API from "./API.jsx";
import "./admin-products.css";

const emptyForm = {
  name: "",
  description: "",
  category: "Cakes",
  price: "",
  image: "",
  stock: 0,
  lowStockThreshold: 5,
  isAvailable: true
};

function AdminProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const user = JSON.parse(
    localStorage.getItem("crumbco-user") || "null"
  );

  const token = localStorage.getItem("crumbco-token");

  useEffect(() => {
    if (!token || !user || user.role !== "ADMIN") {
      navigate("/admin/login", { replace: true });
      return;
    }

    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/products");
      setProducts(response.data.products || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const openEditForm = (product) => {
    setForm({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "Cakes",
      price: product.price ?? "",
      image: product.image || "",
      stock: product.stock ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      isAvailable: product.isAvailable ?? true
    });

    setEditingId(product._id);
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      lowStockThreshold: Number(form.lowStockThreshold)
    };

    try {
      if (editingId) {
        await API.patch(`/products/${editingId}`, payload);
        setMessage("Product updated successfully.");
      } else {
        await API.post("/products", payload);
        setMessage("Product added successfully.");
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${product.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await API.delete(`/products/${product._id}`);
      setMessage("Product removed successfully.");
      await fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete product."
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("crumbco-token");
    localStorage.removeItem("crumbco-user");
    navigate("/admin/login");
  };

  return (
    <div className="admin-products-page">
      <header className="admin-products-header">
        <Link to="/" className="admin-products-brand">
          <span className="admin-brand-icon">
            <CakeSlice size={23} />
          </span>
          <span>
            crumb<span>&</span>co.
            <small>BAKERY · PATISSERIE</small>
          </span>
        </Link>

        <div className="admin-header-actions">
          <span>ADMIN PANEL</span>
          <button onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="admin-products-main">
        <Link to="/admin/dashboard" className="admin-back-link">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="admin-products-heading">
          <div>
            <span className="admin-eyebrow">CRUMB & CO. MANAGEMENT</span>
            <h1>Product Management</h1>
            <p>Add, update and manage your bakery products.</p>
          </div>

          <button className="admin-add-button" onClick={openAddForm}>
            <Plus size={18} /> Add Product
          </button>
        </div>

        {message && <div className="admin-success">{message}</div>}
        {error && <div className="admin-error">{error}</div>}

        <section className="admin-product-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Our Products</h2>
              <p>{products.length} active products</p>
            </div>

            <button
              className="admin-refresh-button"
              onClick={fetchProducts}
              title="Refresh products"
            >
              <RefreshCw size={17} /> Refresh
            </button>
          </div>

          {loading ? (
            <p className="admin-empty">Loading products...</p>
          ) : products.length === 0 ? (
            <div className="admin-empty">
              <CakeSlice size={35} />
              <h3>No products found</h3>
              <p>Add your first bakery product to get started.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-product-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Availability</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="admin-product-name">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                            />
                          ) : (
                            <span className="admin-product-placeholder">
                              <CakeSlice size={20} />
                            </span>
                          )}

                          <span>{product.name}</span>
                        </div>
                      </td>

                      <td>{product.category}</td>
                      <td>₹{Number(product.price).toLocaleString("en-IN")}</td>
                      <td>{product.stock}</td>

                      <td>
                        <span
                          className={
                            product.isAvailable
                              ? "admin-status available"
                              : "admin-status unavailable"
                          }
                        >
                          {product.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-row-actions">
                          <button
                            className="admin-edit-button"
                            onClick={() => openEditForm(product)}
                            title="Edit product"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            className="admin-delete-button"
                            onClick={() => handleDelete(product)}
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showForm && (
          <div className="admin-form-backdrop">
            <section className="admin-product-form-card">
              <div className="admin-form-heading">
                <div>
                  <span className="admin-eyebrow">PRODUCT DETAILS</span>
                  <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>
                </div>

                <button
                  type="button"
                  className="admin-close-button"
                  onClick={() => setShowForm(false)}
                  aria-label="Close form"
                >
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="admin-product-form">
                <label>
                  Product Name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    maxLength={100}
                    required
                  />
                </label>

                <label>
                  Description
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    maxLength={1000}
                    rows={3}
                  />
                </label>

                <div className="admin-form-grid">
                  <label>
                    Category *
                    <select
                      name="category"
                      value={form.category}
                      onChange={updateField}
                      required
                    >
                      <option>Cakes</option>
                      <option>Pastries</option>
                      <option>Cupcakes</option>
                      <option>Breads</option>
                      <option>Cookies</option>
                    </select>
                  </label>

                  <label>
                    Price (₹) *
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={updateField}
                      required
                    />
                  </label>

                  <label>
                    Stock Quantity
                    <input
                      name="stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={updateField}
                    />
                  </label>

                  <label>
                    Low Stock Threshold
                    <input
                      name="lowStockThreshold"
                      type="number"
                      min="0"
                      value={form.lowStockThreshold}
                      onChange={updateField}
                    />
                  </label>
                </div>

                <label>
                  Image URL
                  <input
                    name="image"
                    type="url"
                    value={form.image}
                    onChange={updateField}
                    placeholder="https://example.com/product.jpg"
                  />
                </label>

                <label className="admin-availability-check">
                  <input
                    name="isAvailable"
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={updateField}
                  />
                  Product is available for customers
                </label>

                <div className="admin-form-actions">
                  <button
                    type="button"
                    className="admin-cancel-button"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="admin-save-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Product"
                        : "Add Product"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminProducts;
