import { Router } from "express";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";
import deleteSprintController from "../../controller/delete/sprint/deleteSprint.controller.js";

const router = Router();

router.post("/delete-sprints", verifyJWTForProfile, deleteSprintController);

export default router;