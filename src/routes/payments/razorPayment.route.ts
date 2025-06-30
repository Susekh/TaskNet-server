import { Request, Response, Router } from "express";
import razorpayment, { razorWebhook } from "../../controller/payments/razorPayments.controller.js";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";

const router = Router();


router.post('/razor/create', verifyJWTForProfile, razorpayment);
//make it as put method later
router.post('/razor/webhook', razorWebhook);

export default router;