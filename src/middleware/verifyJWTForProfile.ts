import asyncHandler from "../utils/asyncHanlder.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import db from "../utils/db/db.js";
import { NextFunction, Response, Request } from "express";

interface JwtToken extends JwtPayload {
  id: string;
  username?: string;
  email?: string;
}

// Extend Express Request to include user property
declare module "express" {
  interface Request {
    user?: {
      id: string;
      username: string;
      email?: string;
      name: string;
      createdAt: Date;
    };
  }
}

export const verifyJWTForProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the token from cookies or Authorization header
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Token not found" });
    }

    // Verify the token (cast env var to string to avoid undefined error)
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      throw new Error("ACCESS_TOKEN_SECRET is not defined");
    }

    const decodedToken = jwt.verify(token, secret) as JwtToken;

    if (!decodedToken.id) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // Fetch the user from the database using db
    const user = await db.user.findUnique({
      where: { id: decodedToken.id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Fix email nullability issue by normalizing email to undefined if null
    req.user = {
      ...user,
      email: user.email ?? undefined,
    };

    next();
  } catch (error: unknown) {
    // Safe error message extraction
    const message = error instanceof Error ? error.message : "Error occurred in authorizing the user";
    return res.status(500).json({ error: message });
  }
});
