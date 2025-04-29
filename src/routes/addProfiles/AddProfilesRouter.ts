import { Router } from "express";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";
import inviteToProjectsController from "../../controller/create/project/inviteToProjects.js";
import addMembersToTaskController from "../../controller/addMembers/addTaskMembers.js";

const router = Router();

router.post('/projects/add-to-project', verifyJWTForProfile, inviteToProjectsController);
router.post('/task/add-to-task', verifyJWTForProfile, addMembersToTaskController);

export default router;