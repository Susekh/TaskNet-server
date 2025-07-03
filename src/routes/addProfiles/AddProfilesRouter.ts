import { Router } from "express";
import inviteToProjectsController from "../../controller/create/project/inviteToProjects.controller.js";
import addMembersToTaskController from "../../controller/addMembers/addTaskMembers.controller.js";

const router = Router();

router.post('/projects/add-to-project', inviteToProjectsController);
router.post('/task/add-to-task', addMembersToTaskController);

export default router;