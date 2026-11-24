import { Router } from "express";
import { createProduct, deleteProduct, getProduct, listProducts, lowStockProducts, updateProduct } from "../controllers/productController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();
router.get("/", listProducts);
router.get("/low-stock", protect, authorize("STAFF", "ADMIN"), lowStockProducts);
router.get("/:id", getProduct);
router.post("/", protect, authorize("ADMIN"), createProduct);
router.patch("/:id", protect, authorize("ADMIN", "STAFF"), updateProduct);
router.delete("/:id", protect, authorize("ADMIN"), deleteProduct);
export default router;
