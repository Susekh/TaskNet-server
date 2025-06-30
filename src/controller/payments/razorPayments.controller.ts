import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
import razorInstance from "../../utils/razor.js";
import { Prisma } from "@prisma/client";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";
import sendMail from "../../utils/mailSender.js";

const razorpayment = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    const user = req.user;

   
    const existingOrder = await db.order.findFirst({
      where: {
        projectId,
        status: 'created', 
      },
    });

    if (existingOrder) {
      return res.json({ ...existingOrder, keyId: process.env.RAZOR_KEY_ID });
    }

    
    const order = await razorInstance.orders.create({
      amount: 70000, 
      currency: "INR",
      receipt: "receipt",
      notes: {
        emailId: user?.email as string,
        name: user?.name as string,
        username: user?.username as string,
      },
    });

   
    const savedOrder = await db.order.create({
      data: {
        projectId,
        orderID: order.id,
        status: order.status,
        amount: order.amount as number,
        currency: order.currency,
        receipt: order.receipt ?? "no_receipt",
        notes: order.notes ?? Prisma.JsonNull,
      },
    });

    
    res.json({ ...savedOrder, keyId: process.env.RAZOR_KEY_ID });

  } catch (error) {
    res.status(500).json({ msg: "Server error." });
    console.error(error);
  }
});

export const razorWebhook = async (req: Request, res: Response) => {
  try {
    const webhooksignature = req.get("X-Razorpay-Signature") as string;

    const isWebhookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      webhooksignature,
      process.env.RAZOR_WEBHOOK_SECRET as string
    );

    if (!isWebhookValid) {
      return res.status(400).json({ msg: "webhook signature is invalid." });
    }

    const paymentdetails = req.body.payload.payment.entity;

    if (req.body.event === "payment.captured") {
      const order = await db.order.update({
        where: { orderID: paymentdetails.order_id },
        data: { status: "captured" },
        select: { projectId: true },
      });

      await db.project.update({
        where: { id: order.projectId },
        data: { isPro: true },
      });

      // Email Data
      const recipientEmail = paymentdetails.notes.email;
      const recipientName = paymentdetails.notes.name || "Customer";
      const subject = "Payment Confirmation - Thank You for Your Purchase";
      const html = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto;">
          <h2 style="color: #2c3e50;">Payment Confirmation</h2>
          <p>Dear ${recipientName},</p>
          <p>We are pleased to confirm that your payment has been successfully processed.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ccc;"><strong>Order ID</strong></td>
              <td style="padding: 8px; border: 1px solid #ccc;">${paymentdetails.order_id}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ccc;"><strong>Amount Paid</strong></td>
              <td style="padding: 8px; border: 1px solid #ccc;">₹${paymentdetails.amount / 100}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ccc;"><strong>Payment Status</strong></td>
              <td style="padding: 8px; border: 1px solid #ccc;">Captured</td>
            </tr>
          </table>
          <p>Your associated project has been upgraded to <strong>Pro</strong> status.</p>
          <p>Best regards,<br/>
          <strong>Subhranshu Sekhar Khilar</strong>
          </p>
          <hr style="margin-top: 40px;" />
          <small style="color: #999;">This is an automated confirmation. No further action is required.</small>
        </div>
      `;

      sendMail(recipientEmail, subject, html);
    };

    if (req.body.event === "payment.failed") {
      await db.order.delete({
        where: { orderID: paymentdetails.order_id }
      });
    }

    res.status(200).json({ msg: "Webhook processed." });
  } catch (error) {
    res.status(500).json({ msg: "server issue" });
    console.log("Error in razorpay webhook validation ::", error);
  }
};

export default razorpayment;
