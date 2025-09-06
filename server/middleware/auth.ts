import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { Request, Response, NextFunction } from "express";
import type { Employee } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "ba6dafbf1b1941cfa1f0d84a6d3070d1";

export interface AuthRequest extends Request {
  user?: Employee;
}

// 🔑 Generate JWT for a user
export function generateToken(employee: Employee): string {
  return jwt.sign(
    {
      id: employee.id,
      email: employee.email,
      role: employee.role,
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

// 🔒 Password hashing
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// 🛡️ Verify JWT middleware
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return res.status(401).json({
      message:
        "Access token required in Authorization header as 'Bearer <token>'",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Employee;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

// 👮 Role-based guard
export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
}
