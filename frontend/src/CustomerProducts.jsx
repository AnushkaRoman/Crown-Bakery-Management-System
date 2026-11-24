
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  ShoppingBag,
  Plus,
  Minus,
  X,
  LoaderCircle,
  RefreshCw,
  PackageCheck
} from "lucide-react";
import API from "./API.jsx";

const CART_KEY = "crumbco-cart";

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function getProductId(product) {
  return String(product._id || product.id);
}

export default function CustomerProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState(readCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Save cart whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  // Fetch products from MongoDB
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
            "Unable to load products. Please check your backend connection."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      active = false;
    };
  }, []);

  // Generate categories from database products
  const categories = useMemo(() => {
    const availableCategories = products
      .map((product) => product.category)
      .filter(Boolean);

    return ["All", ...new Set(availableCategories.sort())];
  }, [products]);

  // Search and category filtering
  const filteredProducts = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "All" || product.category === category;

      const matchesSearch =
        !searchText ||
        [
          product.name,
          product.description,
          product.category
        ].some((value) =>
          String(value || "").toLowerCase().includes(searchText)
        );

      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  // Add product to cart
  function addToCart(product) {
    const id = getProductId(product);
    const stock = Number(product.stock || 0);

    if (!product.isAvailable || stock <= 0) {
      showNotice("This product is currently unavailable.");
      return;
    }

    const existing = cart.find(
      (item) => String(item.productId || item.id) === id
    );

    const currentQuantity = existing
      ? Number(existing.quantity || 0)
      : 0;

    if (currentQuantity >= stock) {
      showNotice("Available stock limit reached.");
      return;
    }

    const cartItem = {
      id,
      productId: id,
      name: product.name,
      category: product.category,
      price: Number(product.price),
      image: product.image || "",
      quantity: currentQuantity + 1
    };

    setCart((items) => {
      if (existing) {
        return items.map((item) =>
          String(item.productId || item.id) === id
            ? { ...item, quantity: currentQuantity + 1 }
            : item
        );
      }

      return [...items, cartItem];
    });

    showNotice(`${product.name} added to your basket.`);
  }

  // Increase or decrease cart quantity
  function changeQuantity(id, amount) {
    setCart((items) =>
      items
        .map((item) => {
          const sameProduct =
            String(item.productId || item.id) === String(id);

          if (!sameProduct) return item;

          return {
            ...item,
            quantity: Number(item.quantity) + amount
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  const cartCount = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const subtotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  return (
    <div className="customer-products-page">

      {/* Header */}
      <header className="customer-products-header">

        <Link
          to="/customer/dashboard"
          className="products-back-link"
        >
          <ArrowLeft size={18} />
          Dashboard
        </Link>

        <Link to="/" className="products-brand">
          crumb<span>&</span>co.
        </Link>

        <button
          className="products-cart-button"
          onClick={() => setCartOpen(true)}
        >
          <ShoppingBag size={19} />
          Cart ({cartCount})
        </button>

      </header>

      <main className="customer-products-main">

        {/* Page heading */}
        <div className="products-heading">

          <p className="products-eyebrow">
            FRESH FROM OUR OVEN
          </p>

          <h1>Our Bakery Collection</h1>

          <p>
            Discover freshly baked treats made with love,
            just for you.
          </p>

        </div>

        {/* Search and categories */}
        <div className="products-toolbar">

          <label className="products-search">
            <Search size={19} />

            <input
              type="search"
              placeholder="Search cakes, pastries, breads..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="products-categories">

            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={category === item ? "active" : ""}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}

          </div>

        </div>

        {/* Notification */}
        {notice && (
          <div className="products-notice" role="status">
            {notice}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="products-state">
            <LoaderCircle
              size={30}
              className="products-spinner"
            />
            <p>Loading freshly baked treats...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="products-state products-error">

            <h3>Collection unavailable</h3>

            <p>{error}</p>

            <button
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={16} />
              Try again
            </button>

          </div>
        )}

        {/* Empty products */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="products-empty">

            <h3>
              {products.length
                ? "No products found"
                : "Our shelves are being stocked"}
            </h3>

            <p>
              {products.length
                ? "Try another product name or category."
                : "Please check back soon."}
            </p>

          </div>
        )}

        {/* Product cards */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="customer-product-grid">

            {filteredProducts.map((product) => {
              const outOfStock =
                !product.isAvailable ||
                Number(product.stock || 0) <= 0;

              return (
                <article
                  className="customer-product-card"
                  key={getProductId(product)}
                >

                  <div className="customer-product-image">

                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="products-image-placeholder">
                        <PackageCheck size={34} />
                      </div>
                    )}

                    <span>
                      {outOfStock
                        ? "Currently unavailable"
                        : "Freshly baked"}
                    </span>

                  </div>

                  <div className="customer-product-info">

                    <p>{product.category}</p>

                    <h3>{product.name}</h3>

                    {product.description && (
                      <div className="products-description">
                        {product.description}
                      </div>
                    )}

                    <div className="customer-product-bottom">

                      <div>
                        <strong>
                          ₹{Number(product.price).toLocaleString("en-IN")}
                        </strong>

                        <small>
                          {outOfStock
                            ? "Out of stock"
                            : `${product.stock} available`}
                        </small>
                      </div>

                      <button
                        type="button"
                        disabled={outOfStock}
                        onClick={() => addToCart(product)}
                      >
                        <Plus size={16} />
                        {outOfStock ? "Unavailable" : "Add to Cart"}
                      </button>

                    </div>

                  </div>

                </article>
              );
            })}

          </div>
        )}

      </main>

      {/* Cart drawer */}
      {cartOpen && (
        <div
          className="customer-cart-overlay"
          onClick={() => setCartOpen(false)}
        >

          <aside
            className="customer-cart-panel"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="customer-cart-heading">

              <div>
                <p>YOUR BASKET</p>
                <h2>Shopping Cart</h2>
              </div>

              <button
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
              >
                <X size={21} />
              </button>

            </div>

            {cart.length === 0 ? (
              <div className="customer-cart-empty">

                <ShoppingBag size={35} />

                <h3>Your cart is empty</h3>

                <p>
                  Add something delicious to get started.
                </p>

              </div>
            ) : (
              <>

                <div className="customer-cart-items">

                  {cart.map((item) => {
                    const id = item.productId || item.id;

                    return (
                      <div
                        className="customer-cart-item"
                        key={id}
                      >

                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                          />
                        )}

                        <div className="customer-cart-item-info">

                          <h4>{item.name}</h4>

                          <p>
                            ₹{Number(item.price).toLocaleString("en-IN")}
                          </p>

                          <div className="customer-quantity-control">

                            <button
                              onClick={() => changeQuantity(id, -1)}
                              aria-label={`Remove one ${item.name}`}
                            >
                              <Minus size={14} />
                            </button>

                            <span>{item.quantity}</span>

                            <button
                              onClick={() => changeQuantity(id, 1)}
                              aria-label={`Add one ${item.name}`}
                            >
                              <Plus size={14} />
                            </button>

                          </div>

                        </div>

                        <strong>
                          ₹{(
                            Number(item.price) * item.quantity
                          ).toLocaleString("en-IN")}
                        </strong>

                      </div>
                    );
                  })}

                </div>

                <div className="customer-cart-footer">

                  <div>
                    <span>Subtotal</span>

                    <strong>
                      ₹{subtotal.toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <p>
                    Delivery charges and final stock confirmation
                    will be calculated at checkout.
                  </p>

                  <Link
  to="/customer/checkout"
  className="checkout-link-button"
>
  Proceed to Checkout
</Link>

                </div>

              </>
            )}

          </aside>

        </div>
      )}

    </div>
  );
}
