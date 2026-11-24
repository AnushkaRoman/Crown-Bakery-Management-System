
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  LoaderCircle,
  PackageCheck,
  RefreshCw
} from "lucide-react";
import API from "./API.jsx";
import "./customer-cart.css";

const CART_KEY = "crumbco-cart";

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function getItemId(item) {
  return String(item.productId || item.id || item._id || "");
}

export default function CustomerCart() {
  const [cart, setCart] = useState(readCart);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const token = localStorage.getItem("crumbco-token");

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    let active = true;

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/products");

        if (active) {
          setProducts(
            Array.isArray(response.data.products)
              ? response.data.products
              : []
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            "Unable to check current product availability."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchProducts();

    return () => {
      active = false;
    };
  }, []);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  }

  function getProductDetails(id) {
    return products.find(
      (product) => String(product._id || product.id) === String(id)
    );
  }

  function changeQuantity(id, amount) {
    const currentItem = cart.find(
      (item) => getItemId(item) === String(id)
    );

    if (!currentItem) return;

    const newQuantity = Number(currentItem.quantity) + amount;

    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }

    const product = getProductDetails(id);

    if (amount > 0) {
      if (!product) {
        showNotice("Product details are unavailable. Please refresh.");
        return;
      }

      if (
        !product.isAvailable ||
        newQuantity > Number(product.stock || 0)
      ) {
        showNotice("You cannot add more than the available stock.");
        return;
      }
    }

    setCart((items) =>
      items.map((item) =>
        getItemId(item) === String(id)
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }

  function removeItem(id) {
    setCart((items) =>
      items.filter((item) => getItemId(item) !== String(id))
    );

    showNotice("Product removed from your cart.");
  }

  function clearCart() {
    setCart([]);
    localStorage.removeItem(CART_KEY);
    showNotice("Your cart has been cleared.");
  }

  const itemCount = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      ),
    [cart]
  );

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

  const deliveryFee = subtotal >= 999 ? 0 : 50;
  const estimatedTotal = subtotal + deliveryFee;

  const unavailableItems = cart.filter((item) => {
    const product = getProductDetails(getItemId(item));

    return (
      !product ||
      !product.isAvailable ||
      Number(product.stock || 0) < Number(item.quantity || 0)
    );
  });

  if (!token) {
    return <Navigate to="/customer/login" replace />;
  }

  return (
    <div className="customer-cart-page">
      <header className="customer-cart-header">
        <Link to="/customer/dashboard" className="customer-cart-back">
          <ArrowLeft size={18} />
          Dashboard
        </Link>

        <Link to="/" className="customer-cart-brand">
          crumb<span>&</span>co.
        </Link>

        <Link
          to="/customer/products"
          className="customer-cart-shop-link"
        >
          Continue shopping
        </Link>
      </header>

      <main className="customer-cart-main">
        <div className="customer-cart-title">
          <p>YOUR BAKERY SELECTION</p>
          <h1>Shopping Cart</h1>
          <span>
            {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
          </span>
        </div>

        {notice && (
          <div className="customer-cart-notice" role="status">
            {notice}
          </div>
        )}

        {loading && (
          <div className="customer-cart-state">
            <LoaderCircle className="customer-cart-spinner" size={30} />
            <p>Checking your bakery items...</p>
          </div>
        )}

        {!loading && error && (
          <div className="customer-cart-error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        )}

        {!loading && !error && cart.length === 0 && (
          <div className="customer-cart-empty">
            <ShoppingBag size={48} />
            <h2>Your cart is empty</h2>
            <p>
              Your next favourite treat is waiting to be discovered.
            </p>
            <Link to="/customer/products">
              <ShoppingCart size={18} />
              Browse bakery products
            </Link>
          </div>
        )}

        {!loading && !error && cart.length > 0 && (
          <div className="customer-cart-layout">
            <section className="customer-cart-list">
              <div className="customer-cart-list-heading">
                <h2>Your items</h2>
                <button onClick={clearCart}>
                  <Trash2 size={15} />
                  Clear cart
                </button>
              </div>

              {cart.map((item) => {
                const id = getItemId(item);
                const product = getProductDetails(id);
                const stock = Number(product?.stock || 0);
                const unavailable =
                  !product ||
                  !product.isAvailable ||
                  stock < Number(item.quantity || 0);

                return (
                  <article className="customer-cart-product" key={id}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="customer-cart-image-placeholder">
                        <PackageCheck size={30} />
                      </div>
                    )}

                    <div className="customer-cart-product-info">
                      <span>{item.category || "Bakery item"}</span>
                      <h3>{item.name}</h3>
                      <strong>
                        ₹{Number(item.price).toLocaleString("en-IN")}
                      </strong>

                      <small className={unavailable ? "stock-warning" : ""}>
                        {unavailable
                          ? "Check availability"
                          : `${stock} available`}
                      </small>
                    </div>

                    <div className="customer-cart-product-actions">
                      <div className="customer-cart-quantity">
                        <button
                          onClick={() => changeQuantity(id, -1)}
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          <Minus size={15} />
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          onClick={() => changeQuantity(id, 1)}
                          disabled={
                            !product ||
                            !product.isAvailable ||
                            Number(item.quantity) >= stock
                          }
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <strong className="customer-cart-line-total">
                        ₹{(
                          Number(item.price) * Number(item.quantity)
                        ).toLocaleString("en-IN")}
                      </strong>

                      <button
                        className="customer-cart-remove"
                        onClick={() => removeItem(id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })}

              {unavailableItems.length > 0 && (
                <div className="customer-cart-warning">
                  Some items have insufficient stock or are unavailable.
                  Update or remove them before checkout.
                </div>
              )}
            </section>

            <aside className="customer-cart-summary">
              <h2>Order Summary</h2>

              <div className="customer-cart-summary-row">
                <span>Items ({itemCount})</span>
                <strong>
                  ₹{subtotal.toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="customer-cart-summary-row">
                <span>Delivery fee</span>
                <strong>
                  {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                </strong>
              </div>

              <div className="customer-cart-summary-total">
                <span>Estimated total</span>
                <strong>
                  ₹{estimatedTotal.toLocaleString("en-IN")}
                </strong>
              </div>

              <p>
                Free delivery on orders of ₹999 or more.
              </p>

              <Link
                to="/customer/checkout"
                className={
                  unavailableItems.length > 0
                    ? "customer-cart-checkout disabled"
                    : "customer-cart-checkout"
                }
                onClick={(event) => {
                  if (unavailableItems.length > 0) {
                    event.preventDefault();
                    showNotice(
                      "Please resolve unavailable items before checkout."
                    );
                  }
                }}
              >
                Proceed to Checkout
                <ArrowLeft size={17} className="checkout-arrow" />
              </Link>

              <Link
                to="/customer/products"
                className="customer-cart-continue"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
