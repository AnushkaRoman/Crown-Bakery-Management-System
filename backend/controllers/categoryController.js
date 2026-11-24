
import Category from "../models/Category.js";
import Product from "../models/Product.js";

export const listCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required."
      });
    }

    if (name.length > 60 || description.length > 300) {
      return res.status(400).json({
        success: false,
        message: "Category name or description is too long."
      });
    }

    const existing = await Category.findOne({
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This category already exists."
      });
    }

    const category = await Category.create({
      name,
      description
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found."
      });
    }

    const oldName = category.name;

    const newName =
      req.body.name !== undefined
        ? String(req.body.name).trim()
        : oldName;

    const description =
      req.body.description !== undefined
        ? String(req.body.description).trim()
        : category.description;

    if (!newName) {
      return res.status(400).json({
        success: false,
        message: "Category name is required."
      });
    }

    if (newName.length > 60 || description.length > 300) {
      return res.status(400).json({
        success: false,
        message: "Category name or description is too long."
      });
    }

    const duplicate = await Category.findOne({
      _id: { $ne: category._id },
      name: {
        $regex: `^${newName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i"
      }
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Another category already uses this name."
      });
    }

    if (newName !== oldName) {
      await Product.updateMany(
        { category: oldName },
        { $set: { category: newName } }
      );
    }

    category.name = newName;
    category.description = description;

    if (typeof req.body.isActive === "boolean") {
      category.isActive = req.body.isActive;
    }

    await category.save();

    res.json({
      success: true,
      message: "Category updated successfully.",
      category
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found."
      });
    }

    const productCount = await Product.countDocuments({
      category: category.name
    });

    if (productCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete this category because ${productCount} product(s) are assigned to it.`
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: "Category deleted successfully."
    });
  } catch (error) {
    next(error);
  }
};
