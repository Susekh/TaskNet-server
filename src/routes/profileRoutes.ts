import { Router } from "express";
import { verifyJWTForProfile } from "../middleware/verifyJWTForProfile.js";
import editDetails from "../controller/Profile/editDetails.controller.js";
import editPassword from "../controller/Profile/editPassword.controller.js";

const router = Router();

router.post("/edit", verifyJWTForProfile, editDetails);
router.post("/edit-password", verifyJWTForProfile, editPassword);

export default router;