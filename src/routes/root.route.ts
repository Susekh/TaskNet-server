import { Router } from "express";
import AuthRouter from "./authRoutes.js";
import ProfileRouter from "./profileRoutes.js";
import createRouter from "./create/createRoutes.js"
import fetchRouter from "./fetchData/fetchRouter.js"
import deleteRouter from "./delete/delete.route.js"
import updateRouter from "./update/update.route.js"
import AddProfilesRouter from "./addProfiles/AddProfilesRouter.js"
import uploadRouter from "./upload/upload.route.js"
import paymentsRouter from "./payments/razorPayment.route.js"
import { verifyJWTForProfile } from "../middleware/verifyJWTForProfile.js";
import genaiRouter from "./genai/gemini.route.js"
import contactUs from "../controller/miscellaneous/contactUs.controller.js";
const router = Router();

router.get("/", (req, res) => {
    res.send("Root Route")
});
router.use("/auth", AuthRouter);
router.use("/profile", ProfileRouter);
router.use("/create", createRouter);
router.use("/fetch", verifyJWTForProfile, fetchRouter)
router.use("/delete", deleteRouter);
router.use("/update", verifyJWTForProfile, updateRouter);
router.use("/add-profiles",verifyJWTForProfile, AddProfilesRouter);
router.use("/payment", paymentsRouter);
router.use("/upload", verifyJWTForProfile, uploadRouter);
router.use("/genai", verifyJWTForProfile, genaiRouter);
router.post("/contact", contactUs);

export default router;