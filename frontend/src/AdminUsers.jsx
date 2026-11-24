
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Plus,
  Users,
  UserRound,
  ClipboardList,
  Pencil,
  UserCheck,
  UserX,
  X
} from "lucide-react";
import "./admin-users.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const emptyForm = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  phoneNumber: "",
  deliveryAddress: "",
  role: "CUSTOMER"
};

function getError(error) {
  return error.response?.data?.message || error.message || "Something went wrong.";
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const token = localStorage.getItem("crumbco-token");

  const api = useMemo(() => axios.create({
    baseURL: API,
    headers: {
      Authorization: `Bearer ${token}`
    }
  }), [token]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/admin/users", {
        params: {
          search,
          role: roleFilter,
          status: statusFilter
        }
      });

      setUsers(response.data.users || []);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }, [api, search, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const customers = users.filter((user) => user.role === "CUSTOMER");
  const staff = users.filter((user) => user.role === "STAFF");
  const activeUsers = users.filter((user) => user.isActive);

  const openAddStaff = () => {
    setSelectedUser(null);
    setForm({ ...emptyForm, role: "STAFF" });
    setError("");
    setModal("add");
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setForm({
      fullName: user.fullName || "",
      username: user.username || "",
      email: user.email || "",
      password: "",
      phoneNumber: user.phoneNumber || "",
      deliveryAddress: user.deliveryAddress || "",
      role: user.role
    });
    setError("");
    setModal("edit");
  };

  const closeModal = () => {
    if (saving) return;
    setModal("");
    setSelectedUser(null);
    setForm(emptyForm);
    setError("");
  };

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (modal === "add") {
        await api.post("/admin/users/staff", {
          fullName: form.fullName,
          username: form.username,
          email: form.email,
          password: form.password,
          phoneNumber: form.phoneNumber
        });
        setNotice("Staff account created successfully.");
      } else {
        await api.patch(`/admin/users/${selectedUser.id}`, {
          fullName: form.fullName,
          username: form.username,
          phoneNumber: form.phoneNumber,
          deliveryAddress: form.deliveryAddress,
          role: form.role
        });
        setNotice("User details updated successfully.");
      }

      setModal("");
setSelectedUser(null);
setForm(emptyForm);
await loadUsers();
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (user) => {
    const action = user.isActive ? "deactivate" : "activate";

    if (!window.confirm(`Are you sure you want to ${action} ${user.fullName}'s account?`)) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await api.patch(`/admin/users/${user.id}/status`, {
        isActive: !user.isActive
      });

      setNotice(`Account ${action}d successfully.`);
      await loadUsers();
    } catch (err) {
      setError(getError(err));
    }
  };

  const removeUser = async (user) => {
    if (!window.confirm(
      `Remove access for ${user.fullName}? Their account record and order history will be preserved.`
    )) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await api.delete(`/admin/users/${user.id}`);
      setNotice("User access removed successfully.");
      await loadUsers();
    } catch (err) {
      setError(getError(err));
    }
  };

  return (
    <div className="admin-users-page">
      <Link to="/admin/dashboard" className="admin-users-back">
        <ArrowLeft size={17} /> Back to dashboard
      </Link>

      <div className="admin-users-heading">
        <div>
          <span className="eyebrow">CRUMB & CO. MANAGEMENT</span>
          <h1>Customers & Staff</h1>
          <p>View and manage bakery customer and staff accounts.</p>
        </div>

        <button className="users-primary-btn" onClick={openAddStaff}>
          <Plus size={18} /> Add Staff
        </button>
      </div>

      <section className="users-stat-grid">
        <article className="users-stat-card">
          <span className="users-stat-icon"><Users /></span>
          <div>
            <small>Total accounts</small>
            <strong>{users.length}</strong>
          </div>
        </article>

        <article className="users-stat-card">
          <span className="users-stat-icon"><UserRound /></span>
          <div>
            <small>Customers</small>
            <strong>{customers.length}</strong>
          </div>
        </article>

        <article className="users-stat-card">
          <span className="users-stat-icon"><ClipboardList /></span>
          <div>
            <small>Staff</small>
            <strong>{staff.length}</strong>
          </div>
        </article>

        <article className="users-stat-card">
          <span className="users-stat-icon"><UserCheck /></span>
          <div>
            <small>Active accounts</small>
            <strong>{activeUsers.length}</strong>
          </div>
        </article>
      </section>

      <section className="users-panel">
        <div className="users-panel-heading">
          <div>
            <h2>All Accounts</h2>
            <p>{users.length} matching account{users.length === 1 ? "" : "s"}</p>
          </div>

          <button className="users-refresh-btn" onClick={loadUsers} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div className="users-filters">
          <label className="users-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, username or email..."
            />
          </label>

          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="ALL">All roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="STAFF">Staff</option>
          </select>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {error && !modal && <div className="users-alert error">{error}</div>}
        {notice && <div className="users-alert success">{notice}</div>}

        {loading ? (
          <div className="users-empty">Loading accounts...</div>
        ) : users.length === 0 ? (
          <div className="users-empty">
            <Users size={38} />
            <h3>No accounts found</h3>
            <p>Try changing your search or filters.</p>
          </div>
        ) : (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="users-person">
                        <span className="users-avatar">
                          {(user.fullName || user.username || "U").charAt(0).toUpperCase()}
                        </span>
                        <span>
                          <strong>{user.fullName}</strong>
                          <small>@{user.username}</small>
                        </span>
                      </div>
                    </td>

                    <td>
                      <strong className="users-email">{user.email}</strong>
                      <small className="users-phone">{user.phoneNumber || "No phone number"}</small>
                    </td>

                    <td>
                      <span className={`users-role ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>

                    <td>
                      <span className={`users-status ${user.isActive ? "active" : "inactive"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-IN")
                        : "—"}
                    </td>

                    <td>
                      <div className="users-actions">
                        <button title="Edit user" onClick={() => openEdit(user)}>
                          <Pencil size={16} />
                        </button>

                        <button
                          title={user.isActive ? "Deactivate account" : "Activate account"}
                          onClick={() => changeStatus(user)}
                        >
                          {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>

                        {user.isActive && (
                          <button
                            className="users-remove-action"
                            title="Remove account access"
                            onClick={() => removeUser(user)}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal && (
        <div className="users-modal-backdrop" onMouseDown={closeModal}>
          <section
            className="users-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="users-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="users-modal-close" onClick={closeModal} type="button">
              <X />
            </button>

            <span className="eyebrow">ACCOUNT DETAILS</span>
            <h2 id="users-modal-title">
              {modal === "add" ? "Add New Staff" : "Edit User"}
            </h2>
            <p className="users-modal-subtitle">
              {modal === "add"
                ? "Create a staff account for your bakery team."
                : "Update this customer's or staff member's details."}
            </p>

            <form onSubmit={submitForm}>
              <label>
                Full name *
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={updateForm}
                  placeholder="Enter full name"
                  required
                  maxLength={80}
                />
              </label>

              <label>
                Username *
                <input
                  name="username"
                  value={form.username}
                  onChange={updateForm}
                  placeholder="Choose a username"
                  required
                  minLength={3}
                  maxLength={30}
                />
              </label>

              {modal === "add" && (
                <>
                  <label>
                    Email address *
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={updateForm}
                      placeholder="staff@example.com"
                      required
                    />
                  </label>

                  <label>
                    Temporary password *
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={updateForm}
                      placeholder="At least 8 characters"
                      minLength={8}
                      required
                    />
                  </label>
                </>
              )}

              {modal === "edit" && (
                <>
                  <label>
                    Email address
                    <input value={form.email} disabled />
                  </label>

                  <label>
                    Account role
                    <select name="role" value={form.role} onChange={updateForm}>
                      <option value="CUSTOMER">Customer</option>
                      <option value="STAFF">Staff</option>
                    </select>
                  </label>

                  <label>
                    Delivery address
                    <textarea
                      name="deliveryAddress"
                      value={form.deliveryAddress}
                      onChange={updateForm}
                      placeholder="Enter address (if applicable)"
                      rows={3}
                    />
                  </label>
                </>
              )}

              <label>
                Phone number
                <input
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={updateForm}
                  placeholder="Enter phone number"
                />
              </label>

              {error && <div className="users-alert error">{error}</div>}

              <div className="users-modal-actions">
                <button type="button" className="users-cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="users-primary-btn" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : modal === "add"
                      ? "Create Staff"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
