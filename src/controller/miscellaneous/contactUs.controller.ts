import asyncHandler from "../../utils/asyncHanlder.js";
import sendMail from "../../utils/mailSender.js";
import { Request, Response } from "express";
import { ApiError } from "../../utils/apiError.js";

const contactUs = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    throw new ApiError(400, "Please fill all required fields");
  }

  try {
    const mailHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">New Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <hr />
          <p style="white-space: pre-wrap;">${message}</p>
          <p style="color: #bbb; font-size: 12px; text-align: center; margin-top: 40px;">
            © ${new Date().getFullYear()} TaskNet. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const supportEmail = process.env.SUPPORT_EMAIL || "";

    sendMail(supportEmail, "New Contact Message from Website", mailHtml);

    res.status(200).json({ status: "success", message: "Message sent successfully" });
  } catch (error) {
    console.error("Error sending contact mail:", error);
    res.status(500).json({ status: "error", message: "Failed to send message" });
  }
});

export default contactUs;
