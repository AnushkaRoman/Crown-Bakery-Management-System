
import express from "express";
import { getSalesReport } from "../controllers/reportController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only Admin can access sales reports
router.get("/", protect, authorize("ADMIN"), getSalesReport);

export default router;
