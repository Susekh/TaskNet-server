import Razorpay from "razorpay";

var razorInstance = new Razorpay({
  key_id: process.env.RAZOR_KEY_ID ,
  key_secret: process.env.RAZOR_KEY_SECRET,
});

export default razorInstance;