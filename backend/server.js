import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import errorHandler from "./middleware/errorMiddleware.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "10kb" }));

app.get("/", (_req, res) => res.json({ message: "Welcome to the Bakery Management System API" }));
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/reports", reportRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const startServer = async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "replace_this_with_a_long_random_secret") {
    throw new Error("Set a private JWT_SECRET in backend/.env before starting the server.");
  }
  await connectDB();
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
};
startServer().catch((error) => { console.error("Server startup failed:", error.message); process.exit(1); });
