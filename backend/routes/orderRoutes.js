
import { Router } from "express";

import {
  allOrders,
  cancelMyOrder,
  myOrders,
  placeOrder,
  updateOrderStatus,
  validateCoupon
} from "../controllers/orderController.js";

import {
  authorize,
  protect
} from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

// Customer routes
router.post(
  "/validate-coupon",
  authorize("CUSTOMER"),
  validateCoupon
);

router.post(
  "/",
  authorize("CUSTOMER"),
  placeOrder
);

router.get(
  "/my",
  authorize("CUSTOMER"),
  myOrders
);

router.patch(
  "/:id/cancel",
  authorize("CUSTOMER"),
  cancelMyOrder
);

// Staff and Admin routes
router.get(
  "/",
  authorize("STAFF", "ADMIN"),
  allOrders
);

router.patch(
  "/:id/status",
  authorize("STAFF", "ADMIN"),
  updateOrderStatus
);

export default router;
