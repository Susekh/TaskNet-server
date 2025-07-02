import { Router } from "express";
import createProjectController from "../../controller/create/project/createProject.controller.js";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";

const router = Router();

router.post("/newProject", verifyJWTForProfile, createProjectController);

export default router;