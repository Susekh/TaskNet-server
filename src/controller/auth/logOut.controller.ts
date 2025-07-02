import { CookieOptions } from "express";
import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
import { Request, Response } from "express";

const logout = asyncHandler(
    async (req : Request, res : Response) => {
    try {
        console.log("User at LogOut :: ", req.body);
        
        // Update the user to unset the refreshToken field
        await db.user.update({
            where: {
                id: req.body.id, // Use the ID from the authenticated user
            },
            data: {
                refreshToken: null, // Set refreshToken to null to remove it
            },
        });

        // Define cookie options
        const options : CookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        };

        // Clear cookies and send response
        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json({ status : "success", successMsg : "Logged out succesfully" });
    } catch (error) {
        return res.status(500).json({ status : "failed", errMsgs : { otherErr : "Error occured at loggin out user."} });
    }
});


export default logout;