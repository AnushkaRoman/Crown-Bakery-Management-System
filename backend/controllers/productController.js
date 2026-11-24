import Product from "../models/Product.js";

export const listProducts = async (req, res, next) => {
  try {
    const { search = "", category = "" } = req.query;
    const filter = { isActive: true };
    if (category && category !== "All treats") filter.category = new RegExp(`^${String(category).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i");
    if (search.trim()) filter.$text = { $search: search.trim() };
    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: products.length, products });
  } catch (error) { next(error); }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.json({ success: true, product });
  } catch (error) { next(error); }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, price, image, stock, lowStockThreshold, isAvailable } = req.body;
    if (!name || !category || price === undefined) return res.status(400).json({ success: false, message: "Name, category and price are required." });
    const product = await Product.create({ name, description, category, price, image, stock, lowStockThreshold, isAvailable });
    res.status(201).json({ success: true, message: "Product created successfully.", product });
  } catch (error) { next(error); }
};

export const updateProduct = async (req, res, next) => {
  try {
    const allowed = ["name", "description", "category", "price", "image", "stock", "lowStockThreshold", "isAvailable", "isActive"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.json({ success: true, message: "Product updated successfully.", product });
  } catch (error) { next(error); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false, isAvailable: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.json({ success: true, message: "Product removed from the catalogue." });
  } catch (error) { next(error); }
};

export const lowStockProducts = async (_req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, $expr: { $lte: ["$stock", "$lowStockThreshold"] } }).sort({ stock: 1 });
    res.json({ success: true, count: products.length, products });
  } catch (error) { next(error); }
};
