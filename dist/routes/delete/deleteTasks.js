import { Router } from "express";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";
import deleteTaskController from "../../controller/delete/sprint/column/task/deleteTaskController.js";
import removeTaskMemberController from "../../controller/delete/sprint/column/task/members/removeTaskMembersController.js";
const router = Router();
router.post("/delete-tasks", verifyJWTForProfile, deleteTaskController);
router.post("/remove-member", verifyJWTForProfile, removeTaskMemberController);
export default router;
//# sourceMappingURL=deleteTasks.js.map