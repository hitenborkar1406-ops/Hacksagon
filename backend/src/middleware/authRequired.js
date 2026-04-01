import jwt from "jsonwebtoken";

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-only-change-me";
}

export default function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    // Convention: sub is user id
    req.auth = {
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
    };
    return next();
  } catch (_err) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
}

