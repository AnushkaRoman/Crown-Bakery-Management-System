
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Tags
} from "lucide-react";

import API from "./API.jsx";
import "./admin-categories.css";

const emptyForm = {
  name: "",
  description: ""
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/categories");
      setCategories(response.data.categories || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (category) => {
    setEditingId(category._id);
    setForm({
      name: category.name,
      description: category.description || ""
    });
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const updateForm = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Please enter a category name.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (editingId) {
        await API.patch(`/categories/${editingId}`, {
          name: form.name.trim(),
          description: form.description.trim()
        });

        setNotice("Category updated successfully.");
      } else {
        await API.post("/categories", {
          name: form.name.trim(),
          description: form.description.trim()
        });

        setNotice("Category added successfully.");
      }

      closeForm();
      await fetchCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (category) => {
    setError("");
    setNotice("");

    try {
      await API.patch(`/categories/${category._id}`, {
        isActive: !category.isActive
      });

      setNotice(
        category.isActive
          ? "Category deactivated."
          : "Category activated."
      );

      await fetchCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to update category status."
      );
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await API.delete(`/categories/${category._id}`);
      setNotice("Category deleted successfully.");
      await fetchCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to delete category."
      );
    }
  };

  return (
    <div className="categories-page">
      <Link to="/admin/dashboard" className="categories-back">
        <ArrowLeft size={17} />
        Back to dashboard
      </Link>

      <div className="categories-heading">
        <div>
          <span className="eyebrow">CRUMB & CO. MANAGEMENT</span>
          <h1>Product Categories</h1>
          <p>
            Organise your bakery products into categories.
          </p>
        </div>

        <button
          className="category-primary-btn"
          onClick={openAddForm}
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {notice && (
        <div className="category-notice">
          {notice}
        </div>
      )}

      {error && !showForm && (
        <div className="category-error">
          {error}
        </div>
      )}

      <section className="categories-panel">
        <div className="categories-panel-heading">
          <div>
            <h2>Our Categories</h2>
            <p>{categories.length} categories</p>
          </div>

          <button
            className="category-refresh-btn"
            onClick={fetchCategories}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="category-empty">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="category-empty">
            <Tags size={38} />
            <h3>No categories found</h3>
            <p>Add your first bakery category to get started.</p>
          </div>
        ) : (
          <div className="category-table-wrap">
            <table className="category-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {categories.map((category) => (
                  <tr key={category._id}>
                    <td>
                      <strong>{category.name}</strong>
                    </td>

                    <td>
                      {category.description || "—"}
                    </td>

                    <td>
                      <span
                        className={
                          category.isActive
                            ? "category-status active"
                            : "category-status inactive"
                        }
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="category-actions">
                        <button
                          title="Edit category"
                          onClick={() => openEditForm(category)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          title={
                            category.isActive
                              ? "Deactivate category"
                              : "Activate category"
                          }
                          onClick={() => toggleStatus(category)}
                        >
                          {category.isActive ? "Disable" : "Enable"}
                        </button>

                        <button
                          title="Delete category"
                          className="category-delete"
                          onClick={() => handleDelete(category)}
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
        <div className="category-modal-backdrop">
          <section className="category-modal">
            <button
              className="category-modal-close"
              onClick={closeForm}
              aria-label="Close form"
            >
              <X />
            </button>

            <span className="eyebrow">CATEGORY DETAILS</span>

            <h2>
              {editingId ? "Edit Category" : "Add New Category"}
            </h2>

            <form onSubmit={handleSubmit}>
              <label>
                Category Name *

                <input
                  name="name"
                  value={form.name}
                  onChange={updateForm}
                  placeholder="e.g. Cakes"
                  maxLength={60}
                  required
                />
              </label>

              <label>
                Description

                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateForm}
                  placeholder="Describe this category..."
                  maxLength={300}
                  rows={4}
                />
              </label>

              {error && (
                <div className="category-error">
                  {error}
                </div>
              )}

              <div className="category-modal-actions">
                <button
                  type="button"
                  className="category-cancel-btn"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="category-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Add Category"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
