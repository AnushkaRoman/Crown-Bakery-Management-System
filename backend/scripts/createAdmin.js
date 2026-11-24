import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "node:dns";
import User from "../models/User.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const run = async () => {
  const { MONGO_URI, ADMIN_NAME, ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET } = process.env;
  if (!MONGO_URI || !JWT_SECRET || !ADMIN_NAME || !ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set MONGO_URI, JWT_SECRET, ADMIN_NAME, ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env first.");
  }
  await mongoose.connect(MONGO_URI);
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) throw new Error("An account with this email already exists.");
  await User.create({ username: ADMIN_USERNAME, fullName: ADMIN_NAME, email, password: ADMIN_PASSWORD, role: "ADMIN" });
  console.log(`Admin account created: ${email}`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
