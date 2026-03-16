import { db } from "../utils/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response } from "express";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/**
 * Sanitize a database column name
 * Only converts names with invalid characters. Preserves valid camelCase.
 */
function sanitizeColumn(name: string): string {
  // Check if already valid: starts with letter/underscore, contains only alphanumeric + underscore
  const isAlreadyValid = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  if (isAlreadyValid) {
    return name; // Keep as-is (preserves camelCase)
  }

  // Apply sanitization only if name has invalid characters
  return name
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^(\d)/, "_$1");
}

export const signup = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
      [email, hashedPassword, name || null],
      function (err) {
        if (err) {
          console.error("Signup error:", err.message);
          return res.status(400).json({ error: "User already exists or database error" });
        }
        
        const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET, { expiresIn: "1h" });
        res.status(201).json({ 
          success: true, 
          token,
          user: { id: this.lastID, email, name }
        });
      }
    );
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error during signup" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user: any) => {
    if (err || !user) {
      console.error("Login error:", err?.message);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
      res.json({ 
        success: true, 
        token,
        user: { id: user.id, email: user.email, name: user.name }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Server error during login" });
    }
  });
};

export const getAllUsers = (req: Request, res: Response) => {
  db.all("SELECT id, email, name, created_at FROM users", [], (err, rows) => {
    if (err) {
      console.error("Get all users error:", err.message);
      return res.status(500).json({ error: "Error fetching users" });
    }
    
    res.json({ 
      success: true, 
      count: rows.length,
      users: rows 
    });
  });
};

export const health = (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date() });
};
