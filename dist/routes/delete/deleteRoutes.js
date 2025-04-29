import { Router } from "express";
import projectRouter from "./deleteProjects.js";
import sprintRouter from "./delteSprints.js";
import columnRouter from "./deleteColumns.js";
import taskRouter from "./deleteTasks.js";
const router = Router();
router.use("/project", projectRouter);
router.use("/sprint", sprintRouter);
router.use("/column", columnRouter);
router.use("/task", taskRouter);
export default router;
//# sourceMappingURL=deleteRoutes.js.map