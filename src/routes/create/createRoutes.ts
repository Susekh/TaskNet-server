import { Router } from "express";
import projectRouter from "./createProjects.js"
import sprintRouter from "./createSprints.js"
import columnRouter from "./createColumns.js"
import taskRouter from "./createTasks.js"

const router = Router();

router.use("/project", projectRouter);
router.use("/sprint", sprintRouter);
router.use("/column", columnRouter)
router.use("/task", taskRouter);

export default router;