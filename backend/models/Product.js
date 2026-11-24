import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: "", trim: true, maxlength: 1000 },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: "" },
  stock: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 5, min: 0 },
  isAvailable: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ name: "text", description: "text", category: "text" });
export default mongoose.model("Product", productSchema);
