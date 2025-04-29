import { Router } from "express";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";
import createTaskController from "../../controller/create/sprint/column/task/createTaskController.js";
import moveTaskInColumnController from "../../controller/create/sprint/column/task/moveTaskInColumnController.js";

const router = Router();

router.post("/newTask", verifyJWTForProfile, createTaskController);
router.post("/move-task", verifyJWTForProfile, moveTaskInColumnController);

export default router;