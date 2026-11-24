
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthPortal, RoleDashboard } from "./AuthPortal.jsx";
import CustomerProducts from "./CustomerProducts.jsx";
import CustomerCheckout from "./CustomerCheckout.jsx";
import AdminProducts from "./AdminProducts.jsx";
import AdminCategories from "./AdminCategories.jsx";
import AdminUsers from "./AdminUsers.jsx";
import AdminOrders from "./AdminOrders.jsx";
import AdminFeedback from "./AdminFeedback.jsx";
import AdminReports from "./AdminReports.jsx";
import CustomerCart from "./CustomerCart.jsx";
import CustomerOrders from "./CustomerOrders.jsx";
import CustomerFeedback from "./CustomerFeedback.jsx";
import StaffDashboard from "./StaffDashboard.jsx";

import {
  ShoppingBag,
  Search,
  Menu,
  X,
  CakeSlice,
  ArrowRight,
  Heart,
  Clock3,
  MapPin,
  ClipboardList,
  ShieldCheck
} from "lucide-react";

import { products } from "./data/products";

const categories = [
  "All treats",
  "Cakes",
  "Pastries",
  "Cupcakes",
  "Breads",
  "Cookies"
];

function BakeryHome() {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("crumbco-cart") || "[]");
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All treats");
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  useEffect(() => {
    localStorage.setItem("crumbco-cart", JSON.stringify(cart));
  }, [cart]);

  const visibleProducts = useMemo(
    () =>
      products.filter((product) => {
        const categoryMatch =
          activeCategory === "All treats" ||
          product.category === activeCategory;

        const searchMatch =
          `${product.name} ${product.category}`
            .toLowerCase()
            .includes(search.toLowerCase());

        return categoryMatch && searchMatch;
      }),
    [activeCategory, search]
  );

  const addToCart = (product) => {
    setCart((items) => {
      const existing = items.find(
        (item) => item.id === product.id
      );

      return existing
        ? items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...items, { ...product, quantity: 1 }];
    });

    setNotice(`${product.name} added to your basket`);
    window.setTimeout(() => setNotice(""), 2200);
  };

  const changeQuantity = (id, amount) => {
    setCart((items) =>
      items
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  return (
    <div className="site-shell">
      <div className="announcement">
        A little happiness, freshly baked every day · Free delivery on orders over ₹999
      </div>

      <header className="header">
        <Link className="brand" to="/" aria-label="Crumb and Co home">
          <span className="brand-mark">
            <CakeSlice size={23} />
          </span>
          <span>
            crumb<span className="brand-amp">&</span>co.
            <small>BAKERY · PATISSERIE</small>
          </span>
        </Link>

        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>

        <nav className={mobileOpen ? "nav nav-open" : "nav"}>
          <a href="#home" onClick={() => setMobileOpen(false)}>
            Home
          </a>
          <a href="#products" onClick={() => setMobileOpen(false)}>
            Our treats
          </a>
          <a href="#story" onClick={() => setMobileOpen(false)}>
            Our story
          </a>
          <a href="#contact" onClick={() => setMobileOpen(false)}>
            Contact
          </a>
          <Link to="/login" onClick={() => setMobileOpen(false)}>
            Login
          </Link>
        </nav>

        <div className="header-actions">
          <label className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a treat..."
            />
          </label>

          <button
            className="cart-button"
            onClick={() => setCartOpen(true)}
            aria-label={`Basket with ${cartCount} items`}
          >
            <ShoppingBag size={19} />
            <span>Basket</span>
            <b>{cartCount}</b>
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <span className="eyebrow">
              <span></span> BAKED WITH LOVE, SERVED WITH JOY
            </span>

            <h1>
              Good days<br />
              start with <em>good</em><br />
              baking.
            </h1>

            <p>
              Thoughtful ingredients, slow mornings and little moments
              of sweetness. Find your new favourite, baked fresh in our kitchen.
            </p>

            <a className="primary-button" href="#products">
              Explore our treats <ArrowRight size={17} />
            </a>

            <div className="hero-note">
              <span className="note-icon">
                <Heart size={16} />
              </span>
              Made fresh daily, just for you
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image"></div>
            <div className="round-stamp">
              FRESH<br /><b>FROM</b><br />OUR OVEN
            </div>
            <div className="image-caption">
              A slice of something lovely.
            </div>
          </div>

          <div className="hero-decoration">✳</div>
        </section>

        <section className="promise-row" id="story">
          <div>
            <CakeSlice />
            <span>
              <b>Freshly baked</b>
              <small>Every single morning</small>
            </span>
          </div>
          <div>
            <Heart />
            <span>
              <b>Made with care</b>
              <small>Good ingredients only</small>
            </span>
          </div>
          <div>
            <Clock3 />
            <span>
              <b>Ready for you</b>
              <small>Easy ordering, less waiting</small>
            </span>
          </div>
          <div>
            <MapPin />
            <span>
              <b>Local goodness</b>
              <small>From our kitchen to you</small>
            </span>
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A FRESH BATCH OF JOY</span>
              <h2>Made to make <em>you smile.</em></h2>
            </div>
            <p>
              From flaky morning favourites to celebration-worthy cakes,
              there's a little something for every craving.
            </p>
          </div>

          <div className="category-row">
            {categories.map((category) => (
              <button
                key={category}
                className={
                  activeCategory === category
                    ? "category active"
                    : "category"
                }
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.name} />
                  <span className="product-tag">{product.tag}</span>
                  <button
                    className="quick-add"
                    onClick={() => addToCart(product)}
                    aria-label={`Add ${product.name} to basket`}
                  >
                    +
                  </button>
                </div>

                <div className="product-info">
                  <span>{product.category}</span>
                  <h3>{product.name}</h3>
                  <div className="product-bottom">
                    <b>₹{product.price}</b>
                    <button onClick={() => addToCart(product)}>
                      Add to basket
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {visibleProducts.length === 0 && (
              <p className="empty-state">
                No treats found. Try another search.
              </p>
            )}
          </div>
        </section>

        <section className="newsletter">
          <div>
            <span className="eyebrow">A NOTE FROM OUR OVEN</span>
            <h2>Sweet things are<br /><em>coming your way.</em></h2>
          </div>
          <p>
            Our little bakery is getting ready to serve you. Follow along
            for fresh batches, seasonal specials and happy updates.
          </p>
          <a href="#contact" className="light-button">
            Say hello <ArrowRight size={16} />
          </a>
        </section>
      </main>

      <footer id="contact">
        <Link className="brand footer-brand" to="/">
          <span className="brand-mark">
            <CakeSlice size={22} />
          </span>
          <span>
            crumb<span className="brand-amp">&</span>co.
            <small>BAKERY · PATISSERIE</small>
          </span>
        </Link>
        <p>Small-batch bakes. Big-hearted goodness.</p>
        <span>
          © {new Date().getFullYear()} Crumb & Co. · Bakery Management System project
        </span>
      </footer>

      {cartOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setCartOpen(false)}
        >
          <aside
            className="cart-drawer"
            onClick={(event) => event.stopPropagation()}
            aria-label="Your basket"
          >
            <div className="drawer-heading">
              <div>
                <span className="eyebrow">A LITTLE SOMETHING LOVELY</span>
                <h2>Your basket</h2>
              </div>
              <button
                className="drawer-close"
                onClick={() => setCartOpen(false)}
                aria-label="Close basket"
              >
                <X />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <ShoppingBag size={34} />
                <h3>Your basket is waiting.</h3>
                <p>
                  Add a freshly baked favourite and it will appear here.
                </p>
                <button
                  className="primary-button"
                  onClick={() => {
                    setCartOpen(false);
                    document.getElementById("products")?.scrollIntoView({
                      behavior: "smooth"
                    });
                  }}
                >
                  Explore treats <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <img src={item.image} alt={item.name} />
                      <div className="cart-item-details">
                        <span>{item.category}</span>
                        <h3>{item.name}</h3>
                        <b>₹{item.price}</b>
                        <div className="quantity-control">
                          <button
                            onClick={() => changeQuantity(item.id, -1)}
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => changeQuantity(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div>
                    <span>Subtotal</span>
                    <b>₹{cartTotal.toLocaleString("en-IN")}</b>
                  </div>
                  <p>
                    Delivery and taxes, if applicable, are calculated at checkout.
                  </p>
                  <button
                    className="checkout-button"
                    onClick={() =>
                      setNotice(
                        "Checkout will be available when online ordering is connected."
                      )
                    }
                  >
                    Continue to checkout <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}

// Login selection page

function LoginChoice() {
  const options = [
    {
      title: "Customer Login",
      description: "Browse treats, place orders and track deliveries.",
      icon: ShoppingBag,
      path: "/customer/login"
    },
    {
      title: "Staff Login",
      description: "Manage customer orders and bakery operations.",
      icon: ClipboardList,
      path: "/staff/login"
    },
    {
      title: "Admin Login",
      description: "Manage products, staff, inventory and reports.",
      icon: ShieldCheck,
      path: "/admin/login"
    }
  ];

  return (
    <div className="login-choice-page">
      <Link to="/" className="auth-brand">
        <span className="brand-mark">
          <CakeSlice size={22} />
        </span>
        <span>
          crumb<span className="brand-amp">&</span>co.
          <small>BAKERY · PATISSERIE</small>
        </span>
      </Link>

      <div className="login-choice-content">
        <span className="eyebrow">WELCOME TO CRUMB&CO.</span>
        <h1>Choose Your Login</h1>
        <p>Select your account type to continue.</p>

        <div className="login-choice-grid">
          {options.map((option) => {
            const Icon = option.icon;

            return (
              <Link
                to={option.path}
                className="login-choice-card"
                key={option.title}
              >
                <span className="login-choice-icon">
                  <Icon size={28} />
                </span>

                <h2>{option.title}</h2>
                <p>{option.description}</p>

                <span className="login-choice-arrow">
                  Continue <ArrowRight size={17} />
                </span>
              </Link>
            );
          })}
        </div>

        <Link to="/" className="login-back-home">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean);

  // Admin product management route
  if (parts[0] === "admin" && parts[1] === "products") {
    return <AdminProducts />;
  }

  if (parts[0] === "login") {
    return <LoginChoice />;
  }

  if (
    ["customer", "staff", "admin"].includes(parts[0]) &&
    parts[1] === "dashboard"
  ) {
    return <RoleDashboard />;
  }

  if (parts[0] === "customer" && parts[1] === "products") {
    return <CustomerProducts />;
  }

  // Customer checkout route
  if (parts[0] === "customer" && parts[1] === "checkout") {
    return <CustomerCheckout />;
  }

  // Admin category management route
if (parts[0] === "admin" && parts[1] === "categories") {
  return <AdminCategories />;
}

// Admin customer and staff management
if (parts[0] === "admin" && parts[1] === "users") {
  return <AdminUsers />;
}

// Admin order management
if (parts[0] === "admin" && parts[1] === "orders") {
  return <AdminOrders />;
}

// Admin customer feedback
if (parts[0] === "admin" && parts[1] === "feedback") {
  return <AdminFeedback />;
}

// Admin Sales Reports
if (parts[0] === "admin" && parts[1] === "reports") {
  return <AdminReports />;
}

// Customer shopping cart
if (parts[0] === "customer" && parts[1] === "cart") {
  return <CustomerCart />;
}

// Customer order history and tracking
if (parts[0] === "customer" && parts[1] === "orders") {
  return <CustomerOrders />;
}

// Staff modules
if (
  parts[0] === "staff" &&
  [
    "orders",
    "prepare",
    "status",
    "inventory",
    "availability",
    "low-stock"
  ].includes(parts[1])
) {
  return <StaffDashboard />;
}

if (parts[0] === "customer" && parts[1] === "feedback") {
  return <CustomerFeedback />;
}

  if (["customer", "staff", "admin"].includes(parts[0])) {
    return <AuthPortal />;
  }

  return <BakeryHome />;
}

export default App;
