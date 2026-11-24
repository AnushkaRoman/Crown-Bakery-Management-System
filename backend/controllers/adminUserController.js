
import User from "../models/User.js";

const safeUser = (user) => ({
  id: user._id,
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  phoneNumber: user.phoneNumber || "",
  role: user.role,
  deliveryAddress: user.deliveryAddress || "",
  isActive: user.isActive,
  createdAt: user.createdAt
});

// GET /api/admin/users
export const listUsers = async (req, res, next) => {
  try {
    const { search = "", role = "ALL", status = "ALL" } = req.query;

    const filter = {
      role: { $in: ["CUSTOMER", "STAFF"] }
    };

    if (["CUSTOMER", "STAFF"].includes(role)) {
      filter.role = role;
    }

    if (status === "ACTIVE") filter.isActive = true;
    if (status === "INACTIVE") filter.isActive = false;

    const cleanSearch = String(search).trim();

    if (cleanSearch) {
      const escaped = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");

      filter.$or = [
        { fullName: regex },
        { username: regex },
        { email: regex }
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: users.length,
      users: users.map(safeUser)
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/users/staff
export const createStaff = async (req, res, next) => {
  try {
    const {
      fullName,
      username,
      email,
      password,
      phoneNumber
    } = req.body;

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, username, email and password are required."
      });
    }

    if (String(username).trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username must contain at least 3 characters."
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters."
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    const staff = await User.create({
      fullName: String(fullName).trim(),
      username: String(username).trim(),
      email: normalizedEmail,
      password,
      phoneNumber: phoneNumber || "",
      role: "STAFF",
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: "Staff account created successfully.",
      user: safeUser(staff)
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id
export const updateManagedUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !["CUSTOMER", "STAFF"].includes(user.role)) {
      return res.status(404).json({
        success: false,
        message: "Customer or staff account not found."
      });
    }

    const allowedFields = [
      "fullName",
      "username",
      "phoneNumber",
      "deliveryAddress"
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    }

    // Admin can change a customer to staff or staff to customer.
    // Admin role assignment is deliberately not allowed here.
    if (req.body.role !== undefined) {
      if (!["CUSTOMER", "STAFF"].includes(req.body.role)) {
        return res.status(400).json({
          success: false,
          message: "Role must be CUSTOMER or STAFF."
        });
      }
      user.role = req.body.role;
    }

    await user.save();

    res.json({
      success: true,
      message: "User details updated successfully.",
      user: safeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/status
export const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false."
      });
    }

    const user = await User.findById(req.params.id);

    if (!user || !["CUSTOMER", "STAFF"].includes(user.role)) {
      return res.status(404).json({
        success: false,
        message: "Customer or staff account not found."
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: isActive
        ? "User account activated successfully."
        : "User account deactivated successfully.",
      user: safeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id
// Soft delete: deactivate the account and preserve its order history.
export const removeUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !["CUSTOMER", "STAFF"].includes(user.role)) {
      return res.status(404).json({
        success: false,
        message: "Customer or staff account not found."
      });
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: "User access removed. The account record and order history have been preserved."
    });
  } catch (error) {
    next(error);
  }
};
