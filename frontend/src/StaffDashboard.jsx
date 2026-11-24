
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import API from "./API";
import "./staff-dashboard.css";

const modules = [
  { path: "/staff/orders", label: "Customer Orders", icon: "📋" },
  { path: "/staff/prepare", label: "Prepare Orders", icon: "👩‍🍳" },
  { path: "/staff/status", label: "Update Order Status", icon: "🔄" },
  { path: "/staff/inventory", label: "Manage Inventory", icon: "📦" },
  { path: "/staff/availability", label: "Product Availability", icon: "🛍️" },
  { path: "/staff/low-stock", label: "Low-Stock Alerts", icon: "⚠️" }
];

const statusOptions = [
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED"
];

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const readableStatus = (status = "") =>
  status.replaceAll("_", " ");

export default function StaffDashboard() {
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [stockValues, setStockValues] = useState({});

  const activeModule =
    modules.find((item) => item.path === location.pathname) ||
    modules[0];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [orderResponse, productResponse] = await Promise.all([
        API.get("/orders"),
        API.get("/products")
      ]);

      setOrders(orderResponse.data.orders || []);
      setProducts(productResponse.data.products || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load staff data. Please check your login and backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const lowStockProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.isActive !== false &&
          Number(product.stock) <= Number(product.lowStockThreshold ?? 5)
      ),
    [products]
  );

  const updateStatus = async (orderId, orderStatus) => {
    if (!orderStatus) return;

    setSavingId(orderId);
    setMessage("");
    setError("");

    try {
      const response = await API.patch(`/orders/${orderId}/status`, {
        orderStatus
      });

      setMessage(response.data.message || "Order status updated successfully.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not update order status."
      );
    } finally {
      setSavingId("");
    }
  };

  const updateStock = async (product) => {
    const newStock = Number(stockValues[product._id] ?? product.stock);

    if (!Number.isInteger(newStock) || newStock < 0) {
      setError("Stock must be a whole number and cannot be negative.");
      return;
    }

    setSavingId(product._id);
    setMessage("");
    setError("");

    try {
      const response = await API.patch(`/products/${product._id}`, {
        stock: newStock,
        isAvailable: newStock > 0 && product.isActive !== false
      });

      setMessage(response.data.message || "Inventory updated successfully.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not update product stock."
      );
    } finally {
      setSavingId("");
    }
  };

  const toggleAvailability = async (product) => {
    const nextAvailability = !product.isAvailable;

    setSavingId(product._id);
    setMessage("");
    setError("");

    try {
      const response = await API.patch(`/products/${product._id}`, {
        isAvailable: nextAvailability
      });

      setMessage(
        response.data.message || "Product availability updated successfully."
      );
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not update availability."
      );
    } finally {
      setSavingId("");
    }
  };

  const renderOrders = (orderList, showPreparation = false) => (
    <div className="staff-order-list">
      {orderList.length === 0 ? (
        <div className="staff-empty">No orders found.</div>
      ) : (
        orderList.map((order) => (
          <article className="staff-order-card" key={order._id}>
            <div className="staff-card-top">
              <div>
                <span className="staff-small-label">ORDER ID</span>
                <h3>#{order._id.slice(-8).toUpperCase()}</h3>
              </div>
              <span className={`staff-status status-${order.orderStatus?.toLowerCase()}`}>
                {readableStatus(order.orderStatus)}
              </span>
            </div>

            <div className="staff-order-details">
              <p>
                <strong>Customer:</strong>{" "}
                {order.customer?.fullName || "Customer"}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {order.customer?.email || "Not available"}
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                {order.customer?.phoneNumber || "Not available"}
              </p>
              <p>
                <strong>Total:</strong> {money(order.total)}
              </p>
              <p>
                <strong>Payment:</strong> {order.paymentMethod || "N/A"} (
                {order.paymentStatus || "N/A"})
              </p>
            </div>

            <div className="staff-order-items">
              <strong>Ordered products</strong>
              {(order.items || []).map((item, index) => (
                <div key={`${order._id}-${index}`}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>{money(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {order.deliveryAddress && (
              <p className="staff-address">
                <strong>Delivery address:</strong>{" "}
                {typeof order.deliveryAddress === "string"
                  ? order.deliveryAddress
                  : Object.values(order.deliveryAddress).filter(Boolean).join(", ")}
              </p>
            )}

            <div className="staff-order-actions">
              <label htmlFor={`status-${order._id}`}>
                {showPreparation ? "Preparation status" : "Update status"}
              </label>
              <select
                id={`status-${order._id}`}
                value={order.orderStatus}
                disabled={
                  savingId === order._id ||
                  ["CANCELLED", "DELIVERED"].includes(order.orderStatus)
                }
                onChange={(event) =>
                  updateStatus(order._id, event.target.value)
                }
              >
                <option value={order.orderStatus}>
                  {readableStatus(order.orderStatus)}
                </option>
                {statusOptions
                  .filter((status) => status !== order.orderStatus)
                  .map((status) => (
                    <option key={status} value={status}>
                      {readableStatus(status)}
                    </option>
                  ))}
              </select>
              {savingId === order._id && <span>Updating...</span>}
            </div>
          </article>
        ))
      )}
    </div>
  );

  const renderProducts = (list, availabilityMode = false) => (
    <div className="staff-product-list">
      {list.length === 0 ? (
        <div className="staff-empty">No products found.</div>
      ) : (
        list.map((product) => (
          <article className="staff-product-card" key={product._id}>
            <div className="staff-product-info">
              {product.image ? (
                <img src={product.image} alt={product.name} />
              ) : (
                <div className="staff-product-placeholder">🍰</div>
              )}
              <div>
                <h3>{product.name}</h3>
                <p>{product.category} · {money(product.price)}</p>
                <p>
                  Current stock: <strong>{product.stock}</strong>
                </p>
                <p>
                  Low-stock threshold: {product.lowStockThreshold ?? 5}
                </p>
              </div>
            </div>

            {availabilityMode ? (
              <div className="staff-availability-actions">
                <span className={product.isAvailable ? "available" : "unavailable"}>
                  {product.isAvailable ? "Available" : "Unavailable"}
                </span>
                <button
                  className="staff-button"
                  disabled={savingId === product._id || product.stock <= 0}
                  onClick={() => toggleAvailability(product)}
                >
                  {savingId === product._id
                    ? "Updating..."
                    : product.isAvailable
                    ? "Mark unavailable"
                    : "Mark available"}
                </button>
              </div>
            ) : (
              <div className="staff-stock-actions">
                <label htmlFor={`stock-${product._id}`}>Update stock</label>
                <input
                  id={`stock-${product._id}`}
                  type="number"
                  min="0"
                  step="1"
                  value={stockValues[product._id] ?? product.stock}
                  onChange={(event) =>
                    setStockValues((current) => ({
                      ...current,
                      [product._id]: event.target.value
                    }))
                  }
                />
                <button
                  className="staff-button"
                  disabled={savingId === product._id}
                  onClick={() => updateStock(product)}
                >
                  {savingId === product._id ? "Saving..." : "Save stock"}
                </button>
              </div>
            )}
          </article>
        ))
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeModule.path) {
      case "/staff/orders":
        return renderOrders(orders);

      case "/staff/prepare":
        return renderOrders(
          orders.filter((order) =>
            ["PLACED", "CONFIRMED", "PREPARING"].includes(order.orderStatus)
          ),
          true
        );

      case "/staff/status":
        return renderOrders(
          orders.filter((order) => !["CANCELLED", "DELIVERED"].includes(order.orderStatus))
        );

      case "/staff/inventory":
        return renderProducts(products);

      case "/staff/availability":
        return renderProducts(products, true);

      case "/staff/low-stock":
        return renderProducts(lowStockProducts);

      default:
        return renderOrders(orders);
    }
  };

  return (
    <div className="staff-page">
      <header className="staff-header">
        <Link to="/" className="staff-brand">
          🍰 crumb&co.
          <span>STAFF WORKSPACE</span>
        </Link>
        <div className="staff-header-right">
          <span>Staff Dashboard</span>
          <Link to="/staff/dashboard">Dashboard home</Link>
        </div>
      </header>

      <div className="staff-layout">
        <aside className="staff-sidebar">
          <div className="staff-sidebar-heading">
            <span>WORKSPACE</span>
            <h2>Bakery Operations</h2>
          </div>

          {modules.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={
                activeModule.path === item.path
                  ? "staff-nav-link active"
                  : "staff-nav-link"
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <Link to="/staff/dashboard" className="staff-back-link">
            ← Back to staff dashboard
          </Link>
        </aside>

        <main className="staff-main">
          <div className="staff-page-heading">
            <div>
              <span className="staff-eyebrow">CRUMB & CO. OPERATIONS</span>
              <h1>{activeModule.label}</h1>
              <p>Manage bakery operations from one place.</p>
            </div>
            <button className="staff-refresh" onClick={loadData}>
              ↻ Refresh
            </button>
          </div>

          <div className="staff-stats">
            <div>
              <span>Total orders</span>
              <strong>{orders.length}</strong>
            </div>
            <div>
              <span>Total products</span>
              <strong>{products.length}</strong>
            </div>
            <div>
              <span>Active orders</span>
              <strong>
                {orders.filter((order) =>
                  !["DELIVERED", "CANCELLED"].includes(order.orderStatus)
                ).length}
              </strong>
            </div>
            <div>
              <span>Low-stock products</span>
              <strong>{lowStockProducts.length}</strong>
            </div>
          </div>

          {message && <div className="staff-message success">{message}</div>}
          {error && <div className="staff-message error">{error}</div>}

          {loading ? (
            <div className="staff-empty">Loading staff information...</div>
          ) : (
            renderContent()
          )}
        </main>
      </div>
    </div>
  );
}
