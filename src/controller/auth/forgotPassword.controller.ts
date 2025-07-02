import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
import crypto from "crypto";
import sendMail from "../../utils/mailSender.js";
import { Request, Response } from "express";
import { ApiError } from "../../utils/apiError.js";

const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token and expiry
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // Token valid for 1 hour

    // Check if a RecoverUser entry already exists for this user
    let recoverUser = await db.recoverAccount.findUnique({
      where: { userId: user.id },
    });

    if (recoverUser) {
      // Update existing recoverUser with new token and expiry
      await db.recoverAccount.update({
        where: { userId: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });
    } else {
      // Create a new recoverUser entry
      await db.recoverAccount.create({
        data: {
          userId: user.id,
          resetToken,
          resetTokenExpiry,
        },
      });
    }

    const resetLink = `${process.env.FRONTEND_URI}/auth/reset-password/${resetToken}`;

    const mailHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #555; font-size: 16px;">
            You recently requested to reset your password for your TaskNet account. Click the button below to proceed:
          </p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" target="_blank" style="background-color: #007BFF; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px;">
              Reset Password
            </a>
          </p>
          <p style="color: #888; font-size: 14px;">
            If you didn’t request this, please ignore this email or contact TaskNet support.
          </p>
          <p style="color: #bbb; font-size: 12px; text-align: center; margin-top: 40px;">
            © ${new Date().getFullYear()} TaskNet. All rights reserved.
          </p>
        </div>
      </div>
    `;

    if (!user.email) {
      throw new ApiError(400, "failed");
    }

    sendMail(user.email, "Reset Password", mailHtml);

    res.status(200).json({ message: "Reset email sent" });
  } catch (error) {
    res.status(404).json({ message: "Mail not sent" });
  }
});

export default forgotPassword;
