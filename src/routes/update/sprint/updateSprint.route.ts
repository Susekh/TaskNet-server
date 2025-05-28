import { Router } from "express";
import updateSprintStatus from "../../../controller/update/sprint/updateSprintStatus.controller.js";
import { verifyJWTForProfile } from "../../../middleware/verifyJWTForProfile.js";

const router = Router();

router.post("/status",verifyJWTForProfile, updateSprintStatus);


export default router;