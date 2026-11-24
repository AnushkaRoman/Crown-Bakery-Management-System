import jwt from "jsonwebtoken";
import User from "../models/User.js";

const createToken = (userId) => jwt.sign(
  { userId },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
);

const publicUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  fullName: user.fullName,
  phoneNumber: user.phoneNumber,
  role: user.role,
  deliveryAddress: user.deliveryAddress
});

export const register = async (req, res, next) => {
  try {
    const { username, email, password, fullName, phoneNumber, deliveryAddress } = req.body;
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ success: false, message: "Username, email, password and full name are required." });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ success: false, message: "Password must contain at least 8 characters." });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ success: false, message: "An account with this email already exists." });

    // Public registration is always CUSTOMER. Staff/Admin accounts are provisioned by an administrator.
    const user = await User.create({ username, email: normalizedEmail, password, fullName, phoneNumber, deliveryAddress, role: "CUSTOMER" });
    return res.status(201).json({ success: true, message: "Registration successful.", token: createToken(user._id), user: publicUser(user) });
  } catch (error) { next(error); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required." });
    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select("+password");
    if (!user || !user.isActive || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }
    return res.status(200).json({ success: true, message: "Login successful.", token: createToken(user._id), user: publicUser(user) });
  } catch (error) { next(error); }
};

export const getMe = async (req, res) => res.json({ success: true, user: publicUser(req.user) });

export const updateProfile = async (req, res, next) => {
  try {
    const allowed = ["username", "fullName", "phoneNumber", "deliveryAddress"];
    for (const key of allowed) if (req.body[key] !== undefined) req.user[key] = req.body[key];
    await req.user.save();
    res.json({ success: true, message: "Profile updated successfully.", user: publicUser(req.user) });
  } catch (error) { next(error); }
};

export const logout = async (_req, res) => {
  // JWT is stateless; the client must discard its token on logout.
  res.json({ success: true, message: "Logout successful. Please discard the stored token." });
};
