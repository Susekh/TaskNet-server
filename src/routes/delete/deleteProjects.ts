import { Router } from "express";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";
import deleteProjectController from "../../controller/delete/project/deleteProject.controller.js";
import deleteProjectMemberController from "../../controller/delete/project/deleteProjectMember.controller.js";

const router = Router();

router.post("/delete-Project", verifyJWTForProfile, deleteProjectController);
router.post("/delete-member", verifyJWTForProfile, deleteProjectMemberController);

export default router;