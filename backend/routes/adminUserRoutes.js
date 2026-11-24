
import { Router } from "express";

import {
  listUsers,
  createStaff,
  updateManagedUser,
  updateUserStatus,
  removeUser
} from "../controllers/adminUserController.js";

import {
  protect,
  authorize
} from "../middleware/authMiddleware.js";

const router = Router();

// Every route in this file requires an Admin login.
router.use(protect, authorize("ADMIN"));

router.get("/", listUsers);
router.post("/staff", createStaff);
router.patch("/:id", updateManagedUser);
router.patch("/:id/status", updateUserStatus);
router.delete("/:id", removeUser);

export default router;
