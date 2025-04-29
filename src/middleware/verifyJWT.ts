import asyncHandler from "../utils/asyncHanlder.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import db from "../utils/db/db.js";
import { NextFunction, Response, Request } from "express";

interface JwtToken extends JwtPayload {
    id: string;
    username?: string;
    email?: string;
}


export const verifyJWT = asyncHandler(async (req : Request, res : Response, next : NextFunction) => {
    try {
        // Get the token from cookies or Authorization header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        console.log("Request at VerifyJWT :: ", req.body);
        

        if (!token) {
            return res.status(401).json({ error: "Token not found" });
        }

        // Verify the token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as JwtToken;

        console.log("Decoded Token :: ", decodedToken);
        

        // Fetch the user from the database using db
        const user = await db.user.findUnique({
            where: {
                id: decodedToken.id, // Use the id field from the decoded token
            },
            select: {
                id: true,
                username: true,
                email: true,
                name : true,
                createdAt: true,
                // Exclude password and refreshToken fields
            },
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid token" });
        }

        // Attach user to request object
        req.body = user;
        next();
    } catch (error) {
        return res.status(500).json({ error: "Error occurred in authorizing the user", message: error.message });
    }
});
