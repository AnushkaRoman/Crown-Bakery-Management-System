import { Router } from "express";
import {
  createFeedback,
  deleteFeedback,
  getAllFeedback
} from "../controllers/feedbackController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

// Customer submits feedback
router.post("/", authorize("CUSTOMER"), createFeedback);

// Admin views all feedback
router.get("/", authorize("ADMIN"), getAllFeedback);

// Admin deletes feedback
router.delete("/:id", authorize("ADMIN"), deleteFeedback);

export default router;