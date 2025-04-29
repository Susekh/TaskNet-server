import { Router } from "express";
import createSprintController from "../../controller/create/sprint/createSprintController.js";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";

const router = Router();

router.post("/", verifyJWTForProfile, createSprintController);

export default router;