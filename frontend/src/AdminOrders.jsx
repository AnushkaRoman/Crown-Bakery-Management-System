
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  RefreshCw,
  Search,
  Package,
  Clock3,
  CheckCircle2,
  Eye,
  Boxes,
  AlertTriangle,
  XCircle,
  Save,
  ShoppingBasket
} from "lucide-react";
import API from "./API.jsx";
import "./admin-orders.css";

const statuses = [
  "ALL",
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED"
];

const statusLabels = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "—";

function AdminOrders() {
  // Main page tab
  const [activeTab, setActiveTab] = useState("orders");

  // Orders states
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState("");

  // Inventory states
  const [products, setProducts] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState("ALL");
  const [savingProductId, setSavingProductId] = useState("");

  // Shared messages
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Editable stock values
  const [stockEdits, setStockEdits] = useState({});

  // --------------------------------------------------
  // FETCH ORDERS
  // --------------------------------------------------

  const fetchOrders = useCallback(async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await API.get("/orders");
      setOrders(response.data.orders || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load orders. Please check your connection and login."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // --------------------------------------------------
  // FETCH INVENTORY
  // --------------------------------------------------

  const fetchInventory = useCallback(async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) setRefreshing(true);
      else setInventoryLoading(true);

      const response = await API.get("/products");
      const productList = response.data.products || [];

      setProducts(productList);

      // Prepare editable values for each product
      const edits = {};

      productList.forEach((product) => {
        edits[product._id] = {
          stock: Number(product.stock || 0),
          lowStockThreshold: Number(product.lowStockThreshold ?? 5),
          isAvailable: Boolean(product.isAvailable)
        };
      });

      setStockEdits(edits);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load inventory. Please check your connection and login."
      );
    } finally {
      setInventoryLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchInventory();
  }, [fetchOrders, fetchInventory]);

  // --------------------------------------------------
  // FILTER ORDERS
  // --------------------------------------------------

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const customerName = order.customer?.fullName || "";
      const email = order.customer?.email || "";
      const orderId = order._id || "";

      const matchesSearch =
        !query ||
        customerName.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        orderId.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" || order.orderStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // --------------------------------------------------
  // ORDER STATISTICS
  // --------------------------------------------------

  const statistics = useMemo(() => ({
    total: orders.length,
    placed: orders.filter((o) => o.orderStatus === "PLACED").length,
    preparing: orders.filter((o) =>
      ["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(o.orderStatus)
    ).length,
    delivered: orders.filter((o) => o.orderStatus === "DELIVERED").length
  }), [orders]);

  // --------------------------------------------------
  // UPDATE ORDER STATUS
  // --------------------------------------------------

  const updateStatus = async (orderId, orderStatus) => {
    try {
      setUpdatingId(orderId);
      setError("");
      setNotice("");

      const response = await API.patch(`/orders/${orderId}/status`, {
        orderStatus
      });

      setOrders((current) =>
        current.map((order) =>
          order._id === orderId ? response.data.order : order
        )
      );

      if (selectedOrder?._id === orderId) {
        setSelectedOrder(response.data.order);
      }

      // Refresh inventory because cancelling an order restores stock
      if (orderStatus === "CANCELLED") {
        await fetchInventory();
      }

      setNotice("Order status updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update order status."
      );
    } finally {
      setUpdatingId("");
    }
  };

  // --------------------------------------------------
  // INVENTORY STATISTICS
  // --------------------------------------------------

  const inventoryStatistics = useMemo(() => {
    const totalProducts = products.length;

    const totalStock = products.reduce(
      (sum, product) => sum + Number(product.stock || 0),
      0
    );

    const lowStock = products.filter(
      (product) =>
        Number(product.stock || 0) > 0 &&
        Number(product.stock || 0) <= Number(product.lowStockThreshold ?? 5)
    ).length;

    const outOfStock = products.filter(
      (product) => Number(product.stock || 0) === 0
    ).length;

    return {
      totalProducts,
      totalStock,
      lowStock,
      outOfStock
    };
  }, [products]);

  // --------------------------------------------------
  // FILTER INVENTORY
  // --------------------------------------------------

  const filteredProducts = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query);

      const stock = Number(product.stock || 0);
      const threshold = Number(product.lowStockThreshold ?? 5);

      let matchesFilter = true;

      if (inventoryFilter === "LOW_STOCK") {
        matchesFilter = stock > 0 && stock <= threshold;
      } else if (inventoryFilter === "OUT_OF_STOCK") {
        matchesFilter = stock === 0;
      } else if (inventoryFilter === "AVAILABLE") {
        matchesFilter = stock > 0 && product.isAvailable;
      } else if (inventoryFilter === "UNAVAILABLE") {
        matchesFilter = !product.isAvailable;
      }

      return matchesSearch && matchesFilter;
    });
  }, [products, inventorySearch, inventoryFilter]);

  // --------------------------------------------------
  // CHANGE STOCK INPUT
  // --------------------------------------------------

  const updateStockInput = (productId, field, value) => {
    setStockEdits((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        [field]: value
      }
    }));
  };

  // --------------------------------------------------
  // SAVE PRODUCT INVENTORY
  // --------------------------------------------------

  const saveInventory = async (product) => {
    const edit = stockEdits[product._id];

    const stock = Number(edit?.stock);
    const lowStockThreshold = Number(edit?.lowStockThreshold);

    if (
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Number.isInteger(lowStockThreshold) ||
      lowStockThreshold < 0
    ) {
      setError("Stock and low-stock threshold must be whole numbers greater than or equal to zero.");
      return;
    }

    if (stock === 0 && edit.isAvailable) {
      setError("A product with zero stock cannot be marked available.");
      return;
    }

    try {
      setSavingProductId(product._id);
      setError("");
      setNotice("");

      const response = await API.patch(`/products/${product._id}`, {
        stock,
        lowStockThreshold,
        isAvailable: edit.isAvailable
      });

      const updatedProduct = response.data.product;

      setProducts((current) =>
        current.map((item) =>
          item._id === product._id ? updatedProduct : item
        )
      );

      setStockEdits((current) => ({
        ...current,
        [product._id]: {
          stock: Number(updatedProduct.stock || 0),
          lowStockThreshold: Number(updatedProduct.lowStockThreshold ?? 5),
          isAvailable: Boolean(updatedProduct.isAvailable)
        }
      }));

      setNotice(`${product.name} inventory updated successfully.`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to update product inventory."
      );
    } finally {
      setSavingProductId("");
    }
  };

  // --------------------------------------------------
  // PRODUCT STOCK STATUS
  // --------------------------------------------------

  const getStockStatus = (product) => {
    const stock = Number(product.stock || 0);
    const threshold = Number(product.lowStockThreshold ?? 5);

    if (stock === 0) {
      return { label: "Out of stock", className: "out" };
    }

    if (stock <= threshold) {
      return { label: "Low stock", className: "low" };
    }

    if (!product.isAvailable) {
      return { label: "Unavailable", className: "unavailable" };
    }

    return { label: "In stock", className: "good" };
  };

  // --------------------------------------------------
  // REFRESH CURRENT TAB
  // --------------------------------------------------

  const refreshCurrentTab = async () => {
    if (activeTab === "orders") {
      await fetchOrders(true);
    } else {
      await fetchInventory(true);
    }
  };

  return (
    <div className="admin-orders-page">

      {/* HEADER */}

      <header className="orders-header">
        <div>
          <Link to="/admin/dashboard" className="orders-back-link">
            <ArrowLeft size={17} /> Admin Dashboard
          </Link>

          <h1>Orders & Inventory</h1>

          <p>
            Manage customer orders, product stock and bakery availability.
          </p>
        </div>

        <button
          className="orders-refresh-button"
          onClick={refreshCurrentTab}
          disabled={refreshing}
        >
          <RefreshCw size={17} className={refreshing ? "spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* SHARED ALERTS */}

      {error && (
        <div className="orders-alert error">
          {error}
        </div>
      )}

      {notice && (
        <div className="orders-alert success">
          {notice}
        </div>
      )}

      {/* PAGE TABS */}

      <div className="management-tabs">
        <button
          className={activeTab === "orders" ? "management-tab active" : "management-tab"}
          onClick={() => {
            setActiveTab("orders");
            setError("");
            setNotice("");
          }}
        >
          <ClipboardList size={18} />
          Manage Orders
          <span>{orders.length}</span>
        </button>

        <button
          className={activeTab === "inventory" ? "management-tab active" : "management-tab"}
          onClick={() => {
            setActiveTab("inventory");
            setError("");
            setNotice("");
          }}
        >
          <Boxes size={18} />
          Manage Inventory
          <span>{products.length}</span>
        </button>
      </div>

      {/* ==================================================
          ORDERS TAB
      ================================================== */}

      {activeTab === "orders" && (
        <>
          <section className="orders-stats">
            <article className="orders-stat-card">
              <span className="orders-stat-icon"><ClipboardList /></span>
              <div>
                <p>Total orders</p>
                <h2>{statistics.total}</h2>
              </div>
            </article>

            <article className="orders-stat-card">
              <span className="orders-stat-icon"><Clock3 /></span>
              <div>
                <p>New orders</p>
                <h2>{statistics.placed}</h2>
              </div>
            </article>

            <article className="orders-stat-card">
              <span className="orders-stat-icon"><Package /></span>
              <div>
                <p>In progress</p>
                <h2>{statistics.preparing}</h2>
              </div>
            </article>

            <article className="orders-stat-card">
              <span className="orders-stat-icon"><CheckCircle2 /></span>
              <div>
                <p>Delivered</p>
                <h2>{statistics.delivered}</h2>
              </div>
            </article>
          </section>

          <section className="orders-content-card">
            <div className="orders-section-heading">
              <div>
                <h2>All Orders</h2>
                <p>{filteredOrders.length} matching orders</p>
              </div>
            </div>

            <div className="orders-filters">
              <label className="orders-search">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer, email or order ID..."
                />
              </label>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter orders by status"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL" ? "All statuses" : statusLabels[status]}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="orders-empty-state">
                <RefreshCw className="spin" size={28} />
                <h3>Loading orders...</h3>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="orders-empty-state">
                <ClipboardList size={42} />
                <h3>No orders found</h3>
                <p>
                  {orders.length === 0
                    ? "Customer orders will appear here after customers place them."
                    : "Try changing your search or status filter."}
                </p>
              </div>
            ) : (
              <div className="orders-table-wrap">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order._id}>
                        <td className="order-id">
                          #{order._id.slice(-7).toUpperCase()}
                        </td>

                        <td>
                          <strong>{order.customer?.fullName || "Customer"}</strong>
                          <small>{order.customer?.email || "No email"}</small>
                        </td>

                        <td>{formatDate(order.createdAt)}</td>

                        <td>
                          {order.items?.reduce(
                            (sum, item) => sum + item.quantity,
                            0
                          ) || 0}
                        </td>

                        <td className="order-total">
                          {formatCurrency(order.total)}
                        </td>

                        <td>
                          <span className={`payment-pill ${order.paymentStatus?.toLowerCase()}`}>
                            {order.paymentStatus || "PENDING"}
                          </span>
                        </td>

                        <td>
                          <select
                            className={`order-status-select ${order.orderStatus?.toLowerCase()}`}
                            value={order.orderStatus}
                            disabled={
                              updatingId === order._id ||
                              ["DELIVERED", "CANCELLED"].includes(order.orderStatus)
                            }
                            onChange={(e) =>
                              updateStatus(order._id, e.target.value)
                            }
                          >
                            {statuses
                              .filter((s) => s !== "ALL")
                              .map((status) => (
                                <option key={status} value={status}>
                                  {statusLabels[status]}
                                </option>
                              ))}
                          </select>

                          {updatingId === order._id && (
                            <small>Updating...</small>
                          )}
                        </td>

                        <td>
                          <button
                            className="order-view-button"
                            onClick={() => setSelectedOrder(order)}
                            aria-label="View order details"
                          >
                            <Eye size={17} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* ==================================================
          INVENTORY TAB
      ================================================== */}

      {activeTab === "inventory" && (
        <>
          <section className="orders-stats inventory-stats">
            <article className="orders-stat-card">
              <span className="orders-stat-icon"><Boxes /></span>
              <div>
                <p>Total products</p>
                <h2>{inventoryStatistics.totalProducts}</h2>
              </div>
            </article>

            <article className="orders-stat-card">
              <span className="orders-stat-icon"><ShoppingBasket /></span>
              <div>
                <p>Total stock units</p>
                <h2>{inventoryStatistics.totalStock}</h2>
              </div>
            </article>

            <article className="orders-stat-card">
              <span className="orders-stat-icon"><AlertTriangle /></span>
              <div>
                <p>Low-stock products</p>
                <h2>{inventoryStatistics.lowStock}</h2>
              </div>
            </article>

            <article className="orders-stat-card">
              <span className="orders-stat-icon"><XCircle /></span>
              <div>
                <p>Out of stock</p>
                <h2>{inventoryStatistics.outOfStock}</h2>
              </div>
            </article>
          </section>

          <section className="orders-content-card">
            <div className="orders-section-heading">
              <div>
                <h2>Product Inventory</h2>
                <p>
                  {filteredProducts.length} matching products
                </p>
              </div>
            </div>

            <div className="orders-filters inventory-filters">
              <label className="orders-search">
                <Search size={18} />
                <input
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search product name or category..."
                />
              </label>

              <select
                value={inventoryFilter}
                onChange={(e) => setInventoryFilter(e.target.value)}
                aria-label="Filter inventory"
              >
                <option value="ALL">All products</option>
                <option value="AVAILABLE">Available</option>
                <option value="UNAVAILABLE">Unavailable</option>
                <option value="LOW_STOCK">Low stock</option>
                <option value="OUT_OF_STOCK">Out of stock</option>
              </select>
            </div>

            {inventoryLoading ? (
              <div className="orders-empty-state">
                <RefreshCw className="spin" size={28} />
                <h3>Loading inventory...</h3>
              </div>
            ) : products.length === 0 ? (
              <div className="orders-empty-state">
                <Package size={42} />
                <h3>No products found</h3>
                <p>
                  Add products from the Admin Products section. They will appear here automatically.
                </p>
                <Link to="/admin/products" className="inventory-products-link">
                  Manage Products
                </Link>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="orders-empty-state">
                <Search size={38} />
                <h3>No matching products</h3>
                <p>Try changing your search or inventory filter.</p>
              </div>
            ) : (
              <div className="orders-table-wrap">
                <table className="orders-table inventory-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Available stock</th>
                      <th>Low-stock alert at</th>
                      <th>Status</th>
                      <th>Availability</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((product) => {
                      const edit = stockEdits[product._id] || {
                        stock: product.stock || 0,
                        lowStockThreshold: product.lowStockThreshold ?? 5,
                        isAvailable: product.isAvailable
                      };

                      const stockStatus = getStockStatus(product);

                      return (
                        <tr key={product._id}>
                          <td>
                            <strong>{product.name}</strong>
                          </td>

                          <td>{product.category}</td>

                          <td className="order-total">
                            {formatCurrency(product.price)}
                          </td>

                          <td>
                            <input
                              className="inventory-number-input"
                              type="number"
                              min="0"
                              step="1"
                              value={edit.stock}
                              onChange={(e) =>
                                updateStockInput(
                                  product._id,
                                  "stock",
                                  e.target.value
                                )
                              }
                              aria-label={`Stock quantity for ${product.name}`}
                            />
                          </td>

                          <td>
                            <input
                              className="inventory-number-input threshold-input"
                              type="number"
                              min="0"
                              step="1"
                              value={edit.lowStockThreshold}
                              onChange={(e) =>
                                updateStockInput(
                                  product._id,
                                  "lowStockThreshold",
                                  e.target.value
                                )
                              }
                              aria-label={`Low stock threshold for ${product.name}`}
                            />
                          </td>

                          <td>
                            <span className={`stock-status-pill ${stockStatus.className}`}>
                              {stockStatus.label}
                            </span>
                          </td>

                          <td>
                            <label className="availability-control">
                              <input
                                type="checkbox"
                                checked={Boolean(edit.isAvailable)}
                                disabled={Number(edit.stock) === 0}
                                onChange={(e) =>
                                  updateStockInput(
                                    product._id,
                                    "isAvailable",
                                    e.target.checked
                                  )
                                }
                              />
                              <span>
                                {edit.isAvailable ? "Available" : "Unavailable"}
                              </span>
                            </label>
                          </td>

                          <td>
                            <button
                              className="inventory-save-button"
                              onClick={() => saveInventory(product)}
                              disabled={savingProductId === product._id}
                            >
                              {savingProductId === product._id ? (
                                <RefreshCw size={15} className="spin" />
                              ) : (
                                <Save size={15} />
                              )}
                              {savingProductId === product._id ? "Saving..." : "Save"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <p className="inventory-help-text">
              Edit the stock quantity and low-stock threshold, then select Save.
              Products at or below their threshold will be marked as low stock.
            </p>
          </section>
        </>
      )}

      {/* ==================================================
          ORDER DETAILS MODAL
      ================================================== */}

      {selectedOrder && (
        <div
          className="order-modal-backdrop"
          onClick={() => setSelectedOrder(null)}
        >
          <section
            className="order-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="order-modal-heading">
              <div>
                <span>ORDER DETAILS</span>
                <h2>#{selectedOrder._id.slice(-7).toUpperCase()}</h2>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            <div className="order-customer-details">
              <h3>Customer information</h3>
              <p><strong>Name:</strong> {selectedOrder.customer?.fullName || "Customer"}</p>
              <p><strong>Email:</strong> {selectedOrder.customer?.email || "—"}</p>
              <p><strong>Phone:</strong> {selectedOrder.customer?.phoneNumber || "—"}</p>
              <p><strong>Delivery address:</strong> {selectedOrder.deliveryAddress}</p>
              <p><strong>Order date:</strong> {formatDate(selectedOrder.createdAt)}</p>
            </div>

            <div className="order-modal-items">
              <h3>Ordered products</h3>

              {selectedOrder.items?.map((item, index) => (
                <div
                  className="order-modal-item"
                  key={`${item.name}-${index}`}
                >
                  <div>
                    <strong>{item.name}</strong>
                    <small>Quantity: {item.quantity}</small>
                  </div>

                  <b>{formatCurrency(item.price * item.quantity)}</b>
                </div>
              ))}
            </div>

            <div className="order-price-summary">
              <p>
                <span>Subtotal</span>
                <strong>{formatCurrency(selectedOrder.subtotal)}</strong>
              </p>

              <p>
                <span>Delivery fee</span>
                <strong>{formatCurrency(selectedOrder.deliveryFee)}</strong>
              </p>

              <p className="grand-total">
                <span>Total</span>
                <strong>{formatCurrency(selectedOrder.total)}</strong>
              </p>

              <p>
                <span>Payment method</span>
                <strong>{selectedOrder.paymentMethod}</strong>
              </p>

              <p>
                <span>Payment status</span>
                <strong>{selectedOrder.paymentStatus}</strong>
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
