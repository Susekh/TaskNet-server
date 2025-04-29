import { Router } from "express";
import editDetails from "../controller/Profile/editDetails.js";
import editPassword from "../controller/Profile/editPassword.js";
import { verifyJWTForProfile } from "../middleware/verifyJWTForProfile.js";

const router = Router();

router.post("/edit", verifyJWTForProfile, editDetails);
router.post("/edit-password", verifyJWTForProfile, editPassword);

export default router;