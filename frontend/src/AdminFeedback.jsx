import { useCallback, useEffect, useMemo, useState } from "react";
import API from "./API.jsx";
import "./admin-feedback.css";

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (search.trim()) params.search = search.trim();
      if (rating !== "ALL") params.rating = rating;

      const response = await API.get("/feedback", { params });

      setFeedback(response.data.feedback || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load customer feedback."
      );
    } finally {
      setLoading(false);
    }
  }, [search, rating]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const statistics = useMemo(() => {
    const total = feedback.length;
    const average = total
      ? feedback.reduce((sum, item) => sum + item.rating, 0) / total
      : 0;

    const positive = feedback.filter((item) => item.rating >= 4).length;

    return { total, average, positive };
  }, [feedback]);

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this feedback?"
    );

    if (!confirmed) return;

    try {
      await API.delete(`/feedback/${id}`);

      setMessage("Feedback deleted successfully.");
      setFeedback((previous) =>
        previous.filter((item) => item._id !== id)
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete feedback."
      );
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

  const renderStars = (value) =>
    "★".repeat(value) + "☆".repeat(5 - value);

  return (
    <main className="admin-feedback-page">
      <header className="feedback-heading">
        <div>
          <p className="feedback-eyebrow">CRUMB & CO. / ADMIN</p>
          <h1>Customer Feedback</h1>
          <p>Read and manage reviews shared by your customers.</p>
        </div>
        <div className="feedback-heading-icon">♡</div>
      </header>

      <section className="feedback-stat-grid">
        <article className="feedback-stat-card">
          <span>Total Feedback</span>
          <strong>{statistics.total}</strong>
          <small>Feedback matching current filters</small>
        </article>

        <article className="feedback-stat-card">
          <span>Average Rating</span>
          <strong>{statistics.average.toFixed(1)} / 5</strong>
          <small>Based on displayed feedback</small>
        </article>

        <article className="feedback-stat-card">
          <span>Positive Reviews</span>
          <strong>{statistics.positive}</strong>
          <small>Ratings of 4 or 5 stars</small>
        </article>
      </section>

      <section className="feedback-panel">
        <div className="feedback-panel-heading">
          <div>
            <h2>Customer Reviews</h2>
            <p>Search, filter, and manage submitted feedback.</p>
          </div>
          <button
            className="feedback-refresh-btn"
            onClick={fetchFeedback}
            type="button"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="feedback-filters">
          <input
            type="search"
            placeholder="Search customer, email, product or comment..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={rating}
            onChange={(event) => setRating(event.target.value)}
          >
            <option value="ALL">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        {message && <div className="feedback-success">{message}</div>}
        {error && <div className="feedback-error">{error}</div>}

        {loading ? (
          <div className="feedback-empty">Loading feedback...</div>
        ) : feedback.length === 0 ? (
          <div className="feedback-empty">
            <span>♡</span>
            <h3>No feedback found</h3>
            <p>Customer feedback will appear here when submitted.</p>
          </div>
        ) : (
          <div className="feedback-list">
            {feedback.map((item) => (
              <article className="feedback-card" key={item._id}>
                <div className="feedback-card-top">
                  <div className="feedback-customer-avatar">
                    {(item.customer?.fullName ||
                      item.customer?.username ||
                      "C")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="feedback-customer-details">
                    <h3>
                      {item.customer?.fullName ||
                        item.customer?.username ||
                        "Customer"}
                    </h3>
                    <p>{item.customer?.email || "Email unavailable"}</p>
                  </div>

                  <span className="feedback-date">
                    {formatDate(item.createdAt)}
                  </span>
                </div>

                <div className="feedback-product-row">
                  <span>
                    Product:{" "}
                    <strong>
                      {item.product?.name ||
                        item.productName ||
                        "General Feedback"}
                    </strong>
                  </span>
                  <span className="feedback-stars">
                    {renderStars(item.rating)}
                    <small> ({item.rating}/5)</small>
                  </span>
                </div>

                <p className="feedback-comment">{item.comment}</p>

                <div className="feedback-card-actions">
                  <button
                    type="button"
                    onClick={() => handleDelete(item._id)}
                  >
                    Delete Feedback
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}