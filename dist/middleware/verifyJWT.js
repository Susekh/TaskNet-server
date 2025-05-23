import asyncHandler from "../utils/asyncHanlder.js";
import jwt from "jsonwebtoken";
import db from "../utils/db/db.js";
export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        console.log("Request at VerifyJWT :: ", req.body);
        if (!token) {
            return res.status(401).json({ error: "Token not found" });
        }
        // Ensure secret is defined, else throw
        const secret = process.env.ACCESS_TOKEN_SECRET;
        if (!secret) {
            throw new Error("Access token secret is not defined in environment variables");
        }
        // Decode token with explicit unknown cast, then assert to JwtToken
        const decodedToken = jwt.verify(token, secret);
        console.log("Decoded Token :: ", decodedToken);
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
        // Attach user to request object (you may want to extend req interface for strong typing)
        req.body = user;
        next();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Error occurred in authorizing the user";
        return res.status(500).json({ error: message });
    }
});
//# sourceMappingURL=verifyJWT.js.map