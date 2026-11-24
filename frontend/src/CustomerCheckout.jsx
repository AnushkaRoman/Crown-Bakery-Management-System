
import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  MapPin,
  CreditCard,
  Banknote,
  CheckCircle2,
  LoaderCircle,
  PackageCheck,
  Tag,
  XCircle
} from "lucide-react";

import API from "./API.jsx";
import "./customer-checkout.css";

const CART_KEY = "crumbco-cart";

function getSavedCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("crumbco-user") || "null");
  } catch {
    return null;
  }
}

export default function CustomerCheckout() {
  const [cart, setCart] = useState(getSavedCart);
  const [user] = useState(getSavedUser);

  const [address, setAddress] = useState(
    user?.deliveryAddress || ""
  );

  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [loading, setLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  const [error, setError] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponMessage, setCouponMessage] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [successOrder, setSuccessOrder] = useState(null);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) * Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const discountAmount = appliedCoupon
    ? Number(appliedCoupon.discountAmount || 0)
    : 0;

  // Backend uses the same delivery fee calculation.
  const deliveryFee = subtotal >= 999 ? 0 : 50;

  const estimatedTotal = Math.max(
    0,
    subtotal - discountAmount + deliveryFee
  );

  const token = localStorage.getItem("crumbco-token");

  if (!token) {
    return <Navigate to="/customer/login" replace />;
  }

  if (!successOrder && cart.length === 0) {
    return (
      <div className="checkout-empty-page">
        <ShoppingBag size={42} />
        <h2>Your cart is empty</h2>
        <p>Add some bakery favourites before checking out.</p>

        <Link to="/customer/products">
          Browse products
        </Link>
      </div>
    );
  }

  // Prepare order items for backend requests.
  function getOrderItems() {
    return cart.map((item) => ({
      productId: item.productId || item.id || item._id,
      quantity: Number(item.quantity)
    }));
  }

  // ---------------- APPLY COUPON ----------------

  async function applyCoupon() {
    setCouponError("");
    setCouponMessage("");
    setError("");

    const code = couponInput.trim().toUpperCase();

    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    if (cart.length === 0) {
      setCouponError("Your cart is empty.");
      return;
    }

    try {
      setCouponLoading(true);

      const response = await API.post("/orders/validate-coupon", {
        couponCode: code,
        items: getOrderItems()
      });

      const data = response.data;

      setAppliedCoupon({
        couponCode: data.couponCode,
        discountAmount: Number(data.discountAmount || 0),
        description: data.description || ""
      });

      setCouponInput(data.couponCode);

      setCouponMessage(
        `Coupon ${data.couponCode} applied successfully!`
      );

    } catch (err) {
      setAppliedCoupon(null);

      setCouponError(
        err.response?.data?.message ||
        "Unable to validate this coupon. Please try again."
      );

    } finally {
      setCouponLoading(false);
    }
  }

  // ---------------- REMOVE COUPON ----------------

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
    setCouponMessage("");
  }

  // ---------------- PLACE ORDER ----------------

  async function placeOrder(event) {
    event.preventDefault();

    setError("");

    const cleanAddress = address.trim();

    if (cleanAddress.length < 10) {
      setError("Please enter a complete delivery address.");
      return;
    }

    const orderItems = getOrderItems();

    if (
      orderItems.some(
        (item) =>
          !item.productId ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1
      )
    ) {
      setError(
        "Your cart contains an invalid item. Please update your cart."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/orders", {
        items: orderItems,
        deliveryAddress: cleanAddress,
        paymentMethod,
        couponCode: appliedCoupon?.couponCode || ""
      });

      const order = response.data.order;

      localStorage.removeItem(CART_KEY);

      setCart([]);
      setSuccessOrder(order);

      // Update the saved delivery address.
      const updatedUser = {
        ...user,
        deliveryAddress: cleanAddress
      };

      localStorage.setItem(
        "crumbco-user",
        JSON.stringify(updatedUser)
      );

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to place your order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------------- ORDER SUCCESS PAGE ----------------

  if (successOrder) {
    return (
      <div className="checkout-success-page">

        <div className="checkout-success-card">

          <div className="checkout-success-icon">
            <CheckCircle2 size={48} />
          </div>

          <p className="checkout-eyebrow">
            THANK YOU FOR ORDERING
          </p>

          <h1>Your order is placed!</h1>

          <p className="checkout-success-description">
            Thank you for choosing crumb&co. Your bakery order
            has been received successfully.
          </p>

          <div className="checkout-order-number">
            <span>Order ID</span>
            <strong>{successOrder._id}</strong>
          </div>

          <div className="checkout-success-details">

            <div>
              <span>Order status</span>
              <strong>{successOrder.orderStatus}</strong>
            </div>

            <div>
              <span>Payment</span>
              <strong>
                {successOrder.paymentMethod === "COD"
                  ? "Cash on Delivery"
                  : "Simulated Online Payment"}
              </strong>
            </div>

            <div>
              <span>Payment status</span>
              <strong>{successOrder.paymentStatus}</strong>
            </div>

            {successOrder.couponCode && (
              <div>
                <span>Coupon applied</span>
                <strong>{successOrder.couponCode}</strong>
              </div>
            )}

            <div>
              <span>Discount</span>
              <strong>
                -₹{Number(
                  successOrder.discountAmount || 0
                ).toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span>Total amount</span>
              <strong>
                ₹{Number(successOrder.total).toLocaleString("en-IN")}
              </strong>
            </div>

          </div>

          <div className="checkout-success-actions">
            <Link to="/customer/products">
              Continue shopping
            </Link>

            <Link to="/customer/orders">
              Track your order
            </Link>

            <Link to="/customer/dashboard">
              Go to dashboard
            </Link>
          </div>

        </div>

      </div>
    );
  }

  // ---------------- CHECKOUT PAGE ----------------

  return (
    <div className="customer-checkout-page">

      <header className="checkout-header">

        <Link
          to="/customer/products"
          className="checkout-back-link"
        >
          <ArrowLeft size={18} />
          Back to products
        </Link>

        <Link to="/" className="checkout-brand">
          crumb<span>&</span>co.
        </Link>

        <span className="checkout-secure-label">
          Checkout
        </span>

      </header>

      <main className="checkout-main">

        <div className="checkout-title">
          <p className="checkout-eyebrow">
            ALMOST THERE
          </p>

          <h1>Complete your order</h1>

          <p>
            Just confirm your delivery details and payment method.
          </p>
        </div>

        <div className="checkout-layout">

          {/* CHECKOUT FORM */}

          <form
            className="checkout-form-card"
            onSubmit={placeOrder}
          >

            {/* DELIVERY ADDRESS */}

            <section className="checkout-section">

              <div className="checkout-section-heading">
                <span>
                  <MapPin size={19} />
                </span>

                <div>
                  <h2>Delivery address</h2>
                  <p>Where should we deliver your order?</p>
                </div>
              </div>

              <label className="checkout-field">
                Full delivery address

                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="House / Flat number, street, area, city, PIN code"
                  rows={4}
                  minLength={10}
                  required
                />
              </label>

            </section>

            <div className="checkout-divider" />

            {/* COUPON SECTION */}

            <section className="checkout-section">

              <div className="checkout-section-heading">
                <span>
                  <Tag size={19} />
                </span>

                <div>
                  <h2>Apply discount coupon</h2>
                  <p>Have a coupon? Save on your bakery order.</p>
                </div>
              </div>

              {!appliedCoupon ? (
                <>
                  <div className="checkout-coupon-row">

                    <input
                      type="text"
                      value={couponInput}
                      onChange={(event) => {
                        setCouponInput(event.target.value.toUpperCase());
                        setCouponError("");
                        setCouponMessage("");
                      }}
                      placeholder="Enter coupon code"
                      maxLength={30}
                    />

                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading}
                    >
                      {couponLoading
                        ? "Checking..."
                        : "Apply"}
                    </button>

                  </div>

                  {couponError && (
                    <div className="checkout-error" role="alert">
                      {couponError}
                    </div>
                  )}
                </>
              ) : (
                <div className="checkout-applied-coupon">

                  <div>
                    <CheckCircle2 size={20} />

                    <span>
                      <strong>{appliedCoupon.couponCode}</strong>
                      <small>
                        {appliedCoupon.description ||
                          "Discount successfully applied."}
                      </small>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={removeCoupon}
                    aria-label="Remove coupon"
                  >
                    <XCircle size={18} />
                    Remove
                  </button>

                </div>
              )}

              {couponMessage && appliedCoupon && (
                <p className="checkout-coupon-success">
                  {couponMessage}
                </p>
              )}

              <div className="checkout-available-coupons">
                <p>Available demo coupons:</p>
                <small>
                  <strong>SWEET10</strong> – 10% off on orders above ₹300
                </small>
                <small>
                  <strong>WELCOME15</strong> – 15% off on orders above ₹500
                </small>
              </div>

            </section>

            <div className="checkout-divider" />

            {/* PAYMENT METHOD */}

            <section className="checkout-section">

              <div className="checkout-section-heading">
                <span>
                  <CreditCard size={19} />
                </span>

                <div>
                  <h2>Payment method</h2>
                  <p>Choose how you want to pay.</p>
                </div>
              </div>

              <label
                className={`checkout-payment-option ${
                  paymentMethod === "COD" ? "selected" : ""
                }`}
              >

                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={(event) =>
                    setPaymentMethod(event.target.value)
                  }
                />

                <span className="checkout-payment-icon">
                  <Banknote size={22} />
                </span>

                <span className="checkout-payment-text">
                  <strong>Cash on Delivery</strong>
                  <small>Pay when your order arrives.</small>
                </span>

              </label>

              <label
                className={`checkout-payment-option ${
                  paymentMethod === "SIMULATED_ONLINE" ? "selected" : ""
                }`}
              >

                <input
                  type="radio"
                  name="paymentMethod"
                  value="SIMULATED_ONLINE"
                  checked={paymentMethod === "SIMULATED_ONLINE"}
                  onChange={(event) =>
                    setPaymentMethod(event.target.value)
                  }
                />

                <span className="checkout-payment-icon">
                  <CreditCard size={22} />
                </span>

                <span className="checkout-payment-text">
                  <strong>Simulated Online Payment</strong>
                  <small>
                    Demo payment for this project. No real money is charged.
                  </small>
                </span>

              </label>

            </section>

            {error && (
              <div className="checkout-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="checkout-place-order-button"
              disabled={loading || couponLoading}
            >
              {loading ? (
                <>
                  <LoaderCircle
                    className="checkout-spinner"
                    size={18}
                  />
                  Placing your order...
                </>
              ) : (
                <>
                  <PackageCheck size={19} />
                  Place order · ₹{estimatedTotal.toLocaleString("en-IN")}
                </>
              )}
            </button>

            <p className="checkout-note">
              Your order total, coupon validity and stock availability
              are verified by the bakery server before the order is saved.
            </p>

          </form>

          {/* ORDER SUMMARY */}

          <aside className="checkout-summary-card">

            <div className="checkout-summary-heading">
              <h2>Order summary</h2>
              <span>{cart.length} product(s)</span>
            </div>

            <div className="checkout-summary-items">

              {cart.map((item) => (
                <div
                  className="checkout-summary-item"
                  key={item.productId || item.id || item._id}
                >

                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div className="checkout-summary-placeholder">
                      <ShoppingBag size={20} />
                    </div>
                  )}

                  <div className="checkout-summary-item-info">
                    <strong>{item.name}</strong>
                    <small>Qty: {item.quantity}</small>
                  </div>

                  <strong>
                    ₹{(
                      Number(item.price) * Number(item.quantity)
                    ).toLocaleString("en-IN")}
                  </strong>

                </div>
              ))}

            </div>

            <div className="checkout-summary-calculation">

              <div>
                <span>Subtotal</span>
                <strong>
                  ₹{subtotal.toLocaleString("en-IN")}
                </strong>
              </div>

              {appliedCoupon && (
                <div className="checkout-discount-row">
                  <span>
                    Discount ({appliedCoupon.couponCode})
                  </span>

                  <strong>
                    -₹{discountAmount.toLocaleString("en-IN")}
                  </strong>
                </div>
              )}

              <div>
                <span>Delivery fee</span>
                <strong>
                  {deliveryFee === 0
                    ? "FREE"
                    : `₹${deliveryFee}`}
                </strong>
              </div>

              <div className="checkout-total-row">
                <span>Total</span>
                <strong>
                  ₹{estimatedTotal.toLocaleString("en-IN")}
                </strong>
              </div>

              <p>
                Free delivery on orders of ₹999 or more.
              </p>

            </div>

          </aside>

        </div>

      </main>

    </div>
  );
}
