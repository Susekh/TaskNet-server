import { Router } from "express";
import deleteTaskController from "../../controller/delete/sprint/column/task/deleteTask.controller.js";
import removeTaskMemberController from "../../controller/delete/sprint/column/task/members/removeTaskMembers.controller.js";

const router = Router();

router.post("/delete-tasks", deleteTaskController);
router.post("/remove-member", removeTaskMemberController);

export default router;