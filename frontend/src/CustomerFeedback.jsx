import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, ArrowLeft, Send } from "lucide-react";
import API from "./API.jsx";
import "./customer-feedback.css";

export default function CustomerFeedback() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [productName, setProductName] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSuccess("");
    setError("");

    if (rating < 1 || rating > 5) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }

    if (comment.trim().length < 3) {
      setError("Please enter at least 3 characters in your feedback.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/feedback", {
        rating,
        comment: comment.trim(),
        productName: productName.trim() || "General Feedback"
      });

      setSuccess(
        response.data.message || "Thank you! Your feedback was submitted."
      );

      setRating(0);
      setHoverRating(0);
      setProductName("");
      setComment("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit feedback. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const displayedRating = hoverRating || rating;

  return (
    <main className="customer-feedback-page">
      <div className="customer-feedback-container">
        <Link to="/customer/dashboard" className="customer-feedback-back">
          <ArrowLeft size={17} />
          Back to Dashboard
        </Link>

        <header className="customer-feedback-heading">
          <span className="customer-feedback-eyebrow">
            CRUMB & CO. / YOUR EXPERIENCE
          </span>

          <div className="customer-feedback-icon">♡</div>

          <h1>We'd Love Your Feedback!</h1>

          <p>
            Your thoughts help us make every bakery experience sweeter.
            Share your experience with us.
          </p>
        </header>

        <form className="customer-feedback-form" onSubmit={handleSubmit}>
          <section className="customer-rating-section">
            <h2>How would you rate your experience?</h2>
            <p>Select the number of stars you would like to give.</p>

            <div
              className="customer-rating-stars"
              role="group"
              aria-label="Select a rating from 1 to 5 stars"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`customer-rating-star ${
                    star <= displayedRating ? "selected" : ""
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
                  aria-pressed={rating === star}
                >
                  <Star
                    size={36}
                    fill={star <= displayedRating ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>

            <span className="customer-rating-label">
              {rating === 0
                ? "No rating selected"
                : `${rating} out of 5 stars`}
            </span>
          </section>

          <div className="customer-feedback-field">
            <label htmlFor="feedback-product">
              Product Name <span>(Optional)</span>
            </label>
            <input
              id="feedback-product"
              type="text"
              placeholder="e.g. Chocolate Cake, Croissant..."
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              maxLength={100}
            />
          </div>

          <div className="customer-feedback-field">
            <label htmlFor="feedback-comment">Your Feedback</label>
            <textarea
              id="feedback-comment"
              placeholder="Tell us what you liked or what we can improve..."
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              minLength={3}
              maxLength={1000}
              rows={6}
              required
            />
            <small>{comment.length}/1000 characters</small>
          </div>

          {success && (
            <div className="customer-feedback-success" role="status">
              {success}
            </div>
          )}

          {error && (
            <div className="customer-feedback-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="customer-feedback-submit"
            disabled={loading}
          >
            <Send size={17} />
            {loading ? "Submitting..." : "Submit Feedback"}
          </button>

          <p className="customer-feedback-note">
            Thank you for helping Crumb & Co. grow!
          </p>
        </form>
      </div>
    </main>
  );
}