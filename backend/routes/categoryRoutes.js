
import { Router } from "express";

import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from "../controllers/categoryController.js";

import {
  protect,
  authorize
} from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, authorize("ADMIN"));

router.get("/", listCategories);
router.post("/", createCategory);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
