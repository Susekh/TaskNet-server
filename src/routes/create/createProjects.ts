import { Router } from "express";
import createProjectController from "../../controller/create/project/createProjectController.js";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";

const router = Router();

router.post("/newProject", verifyJWTForProfile, createProjectController);

export default router;