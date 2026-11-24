import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  fullName: { type: String, required: true, trim: true },
  phoneNumber: { type: String, trim: true, default: "" },
  role: { type: String, enum: ["CUSTOMER", "STAFF", "ADMIN"], default: "CUSTOMER" },
  deliveryAddress: { type: String, trim: true, default: "" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
