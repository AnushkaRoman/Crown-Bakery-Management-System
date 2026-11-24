import mongoose from "mongoose";
import Feedback from "../models/Feedback.js";

// CUSTOMER: Submit feedback
export const createFeedback = async (req, res, next) => {
  try {
    const { product, productName, rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Rating and comment are required."
      });
    }

    const numericRating = Number(rating);

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5."
      });
    }

    if (typeof comment !== "string" || comment.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Please enter a comment with at least 3 characters."
      });
    }

    let productId = null;
    let savedProductName = productName?.trim() || "General Feedback";

    if (product) {
      if (!mongoose.isValidObjectId(product)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID."
        });
      }

      const Product = mongoose.model("Product");
      const foundProduct = await Product.findOne({
        _id: product,
        isActive: true
      });

      if (!foundProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found."
        });
      }

      productId = foundProduct._id;
      savedProductName = foundProduct.name;
    }

    const feedback = await Feedback.create({
      customer: req.user._id,
      product: productId,
      productName: savedProductName,
      rating: numericRating,
      comment: comment.trim()
    });

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully.",
      feedback
    });
  } catch (error) {
    next(error);
  }
};

// ADMIN: View all feedback with search and rating filters
export const getAllFeedback = async (req, res, next) => {
  try {
    const { search = "", rating = "" } = req.query;

    const filter = {};

    if (rating) {
      const numericRating = Number(rating);

      if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating filter must be between 1 and 5."
        });
      }

      filter.rating = numericRating;
    }

    let feedbackList = await Feedback.find(filter)
      .populate("customer", "fullName username email")
      .populate("product", "name")
      .sort({ createdAt: -1 });

    if (search.trim()) {
      const searchText = search.trim().toLowerCase();

      feedbackList = feedbackList.filter((feedback) => {
        const customerName =
          feedback.customer?.fullName || feedback.customer?.username || "";

        const customerEmail = feedback.customer?.email || "";
        const productName = feedback.product?.name || feedback.productName || "";

        return (
          customerName.toLowerCase().includes(searchText) ||
          customerEmail.toLowerCase().includes(searchText) ||
          productName.toLowerCase().includes(searchText) ||
          feedback.comment.toLowerCase().includes(searchText)
        );
      });
    }

    return res.status(200).json({
      success: true,
      count: feedbackList.length,
      feedback: feedbackList
    });
  } catch (error) {
    next(error);
  }
};

// ADMIN: Delete feedback
export const deleteFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID."
      });
    }

    const feedback = await Feedback.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback deleted successfully."
    });
  } catch (error) {
    next(error);
  }
};