import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
import razorInstance from "../../utils/razor.js";
import { Prisma } from "@prisma/client";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";

const razorpayment = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    const user = req.user;

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
    res.json({ msg: "server error." });
    console.log(error);
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
