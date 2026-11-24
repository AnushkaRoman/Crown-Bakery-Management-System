
import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate
} from "react-router-dom";
import axios from "axios";

import {
  CakeSlice,
  ArrowLeft,
  ShieldCheck,
  ClipboardList,
  ShoppingBag
} from "lucide-react";

// --------------------------------------------------
// API CONFIGURATION
// --------------------------------------------------

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// --------------------------------------------------
// USER ROLES
// --------------------------------------------------

const roles = {
  customer: {
    label: "Customer",
    role: "CUSTOMER",
    icon: ShoppingBag,
    subtitle: "Your favourite bakes are just a sign-in away."
  },

  staff: {
    label: "Staff",
    role: "STAFF",
    icon: ClipboardList,
    subtitle: "Manage orders and keep the bakery running smoothly."
  },

  admin: {
    label: "Admin",
    role: "ADMIN",
    icon: ShieldCheck,
    subtitle: "Manage your bakery operations from one place."
  }
};

// --------------------------------------------------
// AUTHENTICATION PORTAL
// --------------------------------------------------

export function AuthPortal() {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname.split("/").filter(Boolean);
  const roleKey = path[0] || "customer";
  const roleInfo = roles[roleKey] || roles.customer;

  const isRegister = path[1] === "register";
  const Icon = roleInfo.icon;

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    phoneNumber: ""
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const update = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // LOGIN AND REGISTRATION
  const submit = async (event) => {
    event.preventDefault();

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const endpoint = isRegister
        ? "/auth/register"
        : "/auth/login";

      const payload = isRegister
        ? {
            fullName: form.fullName.trim(),
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password,
            phoneNumber: form.phoneNumber.trim()
          }
        : {
            email: form.email.trim(),
            password: form.password
          };

      const response = await axios.post(
        `${API}${endpoint}`,
        payload
      );

      const data = response.data;

      if (!data.user || !data.token) {
        throw new Error("Invalid response received from server.");
      }

      if (data.user.role !== roleInfo.role) {
        setError(
          `This account is registered as ${data.user.role.toLowerCase()}. Please use the correct login portal.`
        );
        return;
      }

      localStorage.setItem("crumbco-token", data.token);

      localStorage.setItem(
        "crumbco-user",
        JSON.stringify(data.user)
      );

      setMessage(
        isRegister
          ? "Account created successfully!"
          : "Login successful!"
      );

      navigate(`/${roleKey}/dashboard`);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to connect to the server."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-top">

        <Link to="/" className="auth-brand">

          <span className="brand-mark">
            <CakeSlice size={22} />
          </span>

          <span>
            Crown Bakery
            <small>FRESHLY BAKED WITH LOVE</small>
          </span>

        </Link>

        <Link to="/" className="back-home">
          <ArrowLeft size={15} />
          Back to bakery
        </Link>

      </div>

      <div className="auth-layout">

        <section className="auth-intro">

          <span className="eyebrow">
            BAKED WITH LOVE, SERVED WITH JOY
          </span>

          <h1>
            {isRegister
              ? "Join our little bakery family."
              : `Welcome back, ${roleInfo.label.toLowerCase()}.`}
          </h1>

          <p>{roleInfo.subtitle}</p>

          <div className="auth-role-icon">
            <Icon size={32} />
          </div>

          <div className="auth-role-links">

            <span>Choose portal</span>

            <Link
              className={roleKey === "customer" ? "selected" : ""}
              to="/customer/login"
            >
              Customer
            </Link>

            <Link
              className={roleKey === "staff" ? "selected" : ""}
              to="/staff/login"
            >
              Staff
            </Link>

            <Link
              className={roleKey === "admin" ? "selected" : ""}
              to="/admin/login"
            >
              Admin
            </Link>

          </div>

        </section>

        <section className="auth-card">

          <span className="eyebrow">
            {roleInfo.label.toUpperCase()} PORTAL
          </span>

          <h2>
            {isRegister
              ? "Create your account"
              : `${roleInfo.label} sign in`}
          </h2>

          <p className="auth-card-sub">
            {isRegister
              ? "A few details and you're ready to order."
              : "Enter your details to continue."}
          </p>

          <form onSubmit={submit}>

            {isRegister && (
              <>
                <label>
                  Full name

                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={update}
                    placeholder="Your full name"
                    required
                  />
                </label>

                <label>
                  Username

                  <input
                    name="username"
                    value={form.username}
                    onChange={update}
                    placeholder="Choose a username"
                    minLength={3}
                    maxLength={30}
                    required
                  />
                </label>

                <label>
                  Phone number (optional)

                  <input
                    type="tel"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={update}
                    placeholder="Your phone number"
                  />
                </label>
              </>
            )}

            <label>
              Email address

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={update}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={update}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </label>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            {message && (
              <div className="auth-success">
                {message}
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={busy}
            >
              {busy
                ? "Please wait..."
                : isRegister
                  ? "Create customer account"
                  : `Sign in as ${roleInfo.label}`}
            </button>

          </form>

          {roleKey === "customer" && (
            <p className="auth-switch">

              {isRegister
                ? "Already have an account?"
                : "New to Crown Bakery?"}

              {" "}

              <Link
                to={
                  isRegister
                    ? "/customer/login"
                    : "/customer/register"
                }
              >
                {isRegister
                  ? "Sign in"
                  : "Create an account"}
              </Link>

            </p>
          )}

          {roleKey !== "customer" && (
            <p className="auth-switch">
              Staff and Admin accounts are created by the bakery administrator.
            </p>
          )}

        </section>

      </div>
    </div>
  );
}

// --------------------------------------------------
// ROLE DASHBOARD SIDEBAR MENUS
// --------------------------------------------------

const dashboardMenus = {
  staff: [
    {
      label: "Customer Orders",
      icon: "📋",
      path: "/staff/orders"
    },
    {
      label: "Prepare Orders",
      icon: "👩‍🍳",
      path: "/staff/prepare"
    },
    {
      label: "Update Order Status",
      icon: "🔄",
      path: "/staff/status"
    },
    {
      label: "Manage Inventory",
      icon: "📦",
      path: "/staff/inventory"
    },
    {
      label: "Product Availability",
      icon: "🛍️",
      path: "/staff/availability"
    },
    {
      label: "Low-Stock Alerts",
      icon: "⚠️",
      path: "/staff/low-stock"
    }
  ],

  admin: [
    {
      label: "Manage Users",
      icon: "👥",
      path: "/admin/users"
    },
    {
      label: "Manage Products",
      icon: "🧁",
      path: "/admin/products"
    },
    {
      label: "Manage Categories",
      icon: "📂",
      path: "/admin/categories"
    },
    {
      label: "Manage Orders",
      icon: "📋",
      path: "/admin/orders"
    },
    {
      label: "Customer Feedback",
      icon: "💬",
      path: "/admin/feedback"
    },
    {
      label: "Sales Reports",
      icon: "📊",
      path: "/admin/reports"
    }
  ],

  customer: [
    {
      label: "Browse Products",
      icon: "🧁",
      path: "/customer/products"
    },
    {
      label: "Shopping Cart",
      icon: "🛒",
      path: "/customer/cart"
    },
    {
      label: "Place Order",
      icon: "🛍️",
      path: "/customer/checkout"
    },
    {
      label: "Track Orders",
      icon: "📦",
      path: "/customer/orders"
    },
    {
      label: "Order History",
      icon: "🕒",
      path: "/customer/orders"
    },
    {
      label: "Give Feedback",
      icon: "💬",
      path: "/customer/feedback"
    }
  ]
};

// --------------------------------------------------
// ROLE DASHBOARD
// --------------------------------------------------

export function RoleDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const path = location.pathname.split("/").filter(Boolean);
  const roleKey = path[0] || "customer";
  const roleInfo = roles[roleKey] || roles.customer;

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("crumbco-user") || "null"
    );
  } catch {
    user = null;
  }

  const token = localStorage.getItem("crumbco-token");

  // PROTECT DASHBOARD
  if (!token || !user || user.role !== roleInfo.role) {
    return (
      <Navigate
        to={`/${roleKey}/login`}
        replace
      />
    );
  }

  const menuItems =
    dashboardMenus[roleKey] || dashboardMenus.customer;

  const dashboardTitles = {
    staff: "Bakery Operations",
    admin: "Bakery Administration",
    customer: "My Bakery"
  };

  const dashboardDescriptions = {
    staff: "Manage orders and keep the bakery running smoothly.",
    admin: "Manage your bakery, products, customers and business operations.",
    customer: "Discover delicious bakes and manage your orders."
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("crumbco-token");
    localStorage.removeItem("crumbco-user");
    navigate(`/${roleKey}/login`);
  };

  // DASHBOARD UI
  return (
    <div className="workspace-layout">

      {/* LEFT SIDEBAR */}

      <aside className="workspace-sidebar">

        <div className="workspace-heading">

          <span className="eyebrow">
            WORKSPACE
          </span>

          <h2>
            {dashboardTitles[roleKey]}
          </h2>

        </div>

        <nav className="workspace-menu">

          {menuItems.map((item, index) => {

            const isActive =
              location.pathname === item.path;

            return (
              <Link
                key={`${item.label}-${index}`}
                to={item.path}
                className={`workspace-menu-item ${
                  isActive ? "active" : ""
                }`}
              >

                <span className="workspace-menu-icon">
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>

              </Link>
            );
          })}

        </nav>

        <Link
          to={`/${roleKey}/dashboard`}
          className="workspace-back"
        >
          ← Back to {roleKey} dashboard
        </Link>

        <button
          type="button"
          className="workspace-logout"
          onClick={logout}
        >
          Sign out
        </button>

      </aside>

      {/* RIGHT CONTENT */}

      <main className="workspace-content">

        <header className="workspace-topbar">

          <Link to="/" className="auth-brand">

            <span className="brand-mark">
              <CakeSlice size={22} />
            </span>

            <span>
              Crown Bakery
              <small>FRESHLY BAKED WITH LOVE</small>
            </span>

          </Link>

          <span className="workspace-user">
            {user.fullName || user.username}
          </span>

        </header>

        <section className="workspace-welcome">

          <span className="eyebrow">
            {roleInfo.label.toUpperCase()} DASHBOARD
          </span>

          <h1>
            Hello, {user.fullName || user.username}!
          </h1>

          <p>
            {dashboardDescriptions[roleKey]}
          </p>

        </section>

        <section className="workspace-overview">

          <div className="workspace-section-heading">

            <div>
              <span className="eyebrow">
                YOUR WORKSPACE
              </span>

              <h2>
                Quick Access
              </h2>
            </div>

          </div>

          <div className="workspace-card-grid">

            {menuItems.map((item, index) => (

              <Link
                key={`${item.label}-card-${index}`}
                to={item.path}
                className="workspace-card"
              >

                <span className="workspace-card-icon">
                  {item.icon}
                </span>

                <h3>
                  {item.label}
                </h3>

                <span className="workspace-card-link">
                  Open module →
                </span>

              </Link>

            ))}

          </div>

        </section>

      </main>

    </div>
  );
}
