import { Router } from "express";
import updateColRouter from "./Columns/updateColumns.js"
import updateRoleRouter from  "./project/updateRolesRoutes.js"
import updateMessage from  "./chat/updateMessage.route.js"
import updateChat from "./chat/updateChat.route.js"
import updateSprint from "./sprint/updateSprint.route.js"

const router = Router();

router.use("/cols", updateColRouter);
router.use("/project",  updateRoleRouter);
router.use("/sprint", updateSprint);
router.use("/message", updateMessage);
router.use("/chat", updateChat);

export default router;