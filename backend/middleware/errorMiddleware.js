const errorHandler = (err, _req, res, _next) => {
  console.error(err);
  if (err.code === 11000) return res.status(409).json({ success: false, message: "An account with this email already exists." });
  if (err.name === "ValidationError") return res.status(400).json({ success: false, message: err.message });
  res.status(err.statusCode || 500).json({ success: false, message: err.message || "Internal server error." });
};
export default errorHandler;
