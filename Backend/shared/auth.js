const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token)
    return res.status(401).json({ message: "A Bearer token is required" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function authorize(...roles) {
  return (req, res, next) =>
    roles.includes(req.user.role)
      ? next()
      : res
          .status(403)
          .json({
            message: "You do not have permission to perform this action",
          });
}

function asyncHandler(handler) {
  return (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);
}

function errorHandler(error, req, res, next) {
  console.error("Request failed:", error.message);
  if (error.code === "23505")
    return res
      .status(409)
      .json({ message: "A record with these values already exists" });
  if (error.code === "23503")
    return res.status(400).json({ message: "A related record does not exist" });
  return res.status(500).json({ message: "Internal server error" });
}

module.exports = { authenticate, authorize, asyncHandler, errorHandler };
