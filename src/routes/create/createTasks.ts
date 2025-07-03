import { Router } from "express";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";
import createTaskController from "../../controller/create/sprint/column/task/createTask.controller.js";
import moveTaskInColumnController from "../../controller/create/sprint/column/task/moveTaskInColumn.controller.js";

const router = Router();

router.post("/newTask", verifyJWTForProfile, createTaskController);
router.post("/move-task", verifyJWTForProfile, moveTaskInColumnController);

export default router;