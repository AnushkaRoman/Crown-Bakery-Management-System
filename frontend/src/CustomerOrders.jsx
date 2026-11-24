
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  PackageCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShoppingBag,
  MapPin,
  CreditCard,
  Receipt,
  ChevronDown,
  ChevronUp,
  Tag
} from "lucide-react";

import API from "./API.jsx";
import "./customer-orders.css";

const statusSteps = [
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED"
];

const statusLabels = {
  PLACED: "Order Placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready for Pickup",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};

function formatDate(date) {
  if (!date) return "Date unavailable";

  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatPrice(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function OrderProgress({ status }) {
  if (status === "CANCELLED") {
    return (
      <div className="order-cancelled-progress">
        <XCircle size={20} />
        <span>This order has been cancelled.</span>
      </div>
    );
  }

  const currentIndex = statusSteps.indexOf(status);

  return (
    <div className="order-progress">
      {statusSteps.map((step, index) => {
        const completed = index <= currentIndex;

        return (
          <div
            className={`order-progress-step ${completed ? "completed" : ""}`}
            key={step}
          >
            <span className="order-progress-dot">
              {completed ? <CheckCircle2 size={17} /> : index + 1}
            </span>

            <small>{statusLabels[step]}</small>
          </div>
        );
      })}
    </div>
  );
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await API.get("/orders/my");

      setOrders(response.data.orders || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load your orders. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Cancel an eligible order
  const cancelOrder = async (order) => {
    const canCancel = ["PLACED", "CONFIRMED"].includes(
      order.orderStatus
    );

    if (!canCancel) {
      setActionError("This order is no longer eligible for cancellation.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel order ${order._id}?`
    );

    if (!confirmed) return;

    try {
      setCancellingId(order._id);
      setActionError("");
      setActionSuccess("");

      await API.patch(`/orders/${order._id}/cancel`);

      setActionSuccess(
        `Order #${order._id} has been cancelled successfully.`
      );

      await fetchOrders(true);
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
        "Unable to cancel this order. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="customer-orders-page">

      <header className="customer-orders-header">
        <Link to="/customer/dashboard" className="orders-back-link">
          <ArrowLeft size={18} />
          Dashboard
        </Link>

        <Link to="/" className="orders-brand">
          crumb<span>&</span>co.
        </Link>

        <Link to="/customer/products" className="orders-shop-link">
          <ShoppingBag size={17} />
          Shop
        </Link>
      </header>

      <main className="customer-orders-main">

        <section className="orders-page-heading">
          <div>
            <span className="orders-eyebrow">YOUR BAKERY JOURNEY</span>
            <h1>My Orders</h1>
            <p>
              Keep track of your bakery orders and revisit your
              previous purchases.
            </p>
          </div>

          <button
            className="orders-refresh-button"
            onClick={() => fetchOrders(true)}
            disabled={refreshing || loading}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "orders-spinning" : ""}
            />
            Refresh
          </button>
        </section>

        {actionSuccess && (
          <div className="orders-success" role="status">
            <CheckCircle2 size={19} />
            {actionSuccess}
          </div>
        )}

        {actionError && (
          <div className="orders-error" role="alert">
            <XCircle size={19} />
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="orders-message">
            <RefreshCw className="orders-spinning" size={28} />
            <h2>Loading your orders...</h2>
          </div>
        ) : error ? (
          <div className="orders-message orders-error-panel">
            <XCircle size={35} />
            <h2>Unable to load orders</h2>
            <p>{error}</p>
            <button onClick={() => fetchOrders()}>
              Try again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-empty">
            <span className="orders-empty-icon">
              <Package size={38} />
            </span>
            <h2>No orders yet</h2>
            <p>
              Your delicious bakery orders will appear here
              after you place your first order.
            </p>
            <Link to="/customer/products">
              Explore bakery products
            </Link>
          </div>
        ) : (
          <>
            <div className="orders-count">
              <span>
                <PackageCheck size={19} />
                {orders.length} order(s) found
              </span>
            </div>

            <div className="orders-list">
              {orders.map((order) => {
                const canCancel = [
                  "PLACED",
                  "CONFIRMED"
                ].includes(order.orderStatus);

                const expanded = expandedOrder === order._id;

                return (
                  <article
                    className="customer-order-card"
                    key={order._id}
                  >

                    <div className="customer-order-top">

                      <div>
                        <span className="order-card-label">
                          ORDER ID
                        </span>

                        <strong className="order-id">
                          #{order._id}
                        </strong>

                        <small className="order-date">
                          {formatDate(order.createdAt)}
                        </small>
                      </div>

                      <span
                        className={`order-status-badge ${String(
                          order.orderStatus
                        ).toLowerCase()}`}
                      >
                        {statusLabels[order.orderStatus] ||
                          order.orderStatus}
                      </span>

                    </div>

                    <div className="order-card-summary">

                      <div className="order-summary-info">
                        <Package size={20} />

                        <span>
                          <strong>
                            {order.items?.length || 0} product(s)
                          </strong>

                          <small>
                            {order.items?.map((item) => item.name).join(", ")}
                          </small>
                        </span>
                      </div>

                      <div className="order-total">
                        <small>Total amount</small>
                        <strong>{formatPrice(order.total)}</strong>
                      </div>

                    </div>

                    <div className="order-progress-section">
                      <h3>Order progress</h3>
                      <OrderProgress status={order.orderStatus} />
                    </div>

                    {canCancel && (
                      <p className="order-cancellation-note">
                        You can cancel this order while it is placed
                        or confirmed.
                      </p>
                    )}

                    <div className="order-card-actions">

                      <button
                        className="order-details-button"
                        onClick={() =>
                          setExpandedOrder(
                            expanded ? null : order._id
                          )
                        }
                      >
                        {expanded ? "Hide details" : "View details"}

                        {expanded
                          ? <ChevronUp size={17} />
                          : <ChevronDown size={17} />}
                      </button>

                      {canCancel && (
                        <button
                          className="order-cancel-button"
                          onClick={() => cancelOrder(order)}
                          disabled={cancellingId === order._id}
                        >
                          {cancellingId === order._id
                            ? "Cancelling..."
                            : "Cancel order"}
                        </button>
                      )}

                    </div>

                    {expanded && (
                      <div className="order-expanded-details">

                        <h3>Ordered products</h3>

                        <div className="order-product-list">
                          {order.items?.map((item, index) => (
                            <div
                              className="order-product-row"
                              key={`${item.product}-${index}`}
                            >
                              <div>
                                <strong>{item.name}</strong>
                                <small>
                                  Quantity: {item.quantity}
                                </small>
                              </div>

                              <strong>
                                {formatPrice(item.price * item.quantity)}
                              </strong>
                            </div>
                          ))}
                        </div>

                        <div className="order-detail-info">

                          <div>
                            <MapPin size={17} />
                            <span>
                              <small>Delivery address</small>
                              <strong>{order.deliveryAddress}</strong>
                            </span>
                          </div>

                          <div>
                            <CreditCard size={17} />
                            <span>
                              <small>Payment method</small>
                              <strong>
                                {order.paymentMethod === "COD"
                                  ? "Cash on Delivery"
                                  : "Simulated Online Payment"}
                              </strong>
                            </span>
                          </div>

                          <div>
                            <Receipt size={17} />
                            <span>
                              <small>Payment status</small>
                              <strong>{order.paymentStatus}</strong>
                            </span>
                          </div>

                          {order.couponCode && (
                            <div>
                              <Tag size={17} />
                              <span>
                                <small>Coupon applied</small>
                                <strong>{order.couponCode}</strong>
                              </span>
                            </div>
                          )}

                        </div>

                        <div className="order-price-breakdown">

                          <div>
                            <span>Subtotal</span>
                            <strong>{formatPrice(order.subtotal)}</strong>
                          </div>

                          {Number(order.discountAmount) > 0 && (
                            <div className="order-discount-row">
                              <span>Discount</span>
                              <strong>
                                -{formatPrice(order.discountAmount)}
                              </strong>
                            </div>
                          )}

                          <div>
                            <span>Delivery fee</span>
                            <strong>
                              {Number(order.deliveryFee) === 0
                                ? "FREE"
                                : formatPrice(order.deliveryFee)}
                            </strong>
                          </div>

                          <div className="order-final-total">
                            <span>Order total</span>
                            <strong>{formatPrice(order.total)}</strong>
                          </div>

                        </div>

                      </div>
                    )}

                  </article>
                );
              })}
            </div>
          </>
        )}

      </main>

    </div>
  );
}
