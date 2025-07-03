import { Router } from "express";
import FetchProjectController from "../../controller/fetch/FetchProject.controller.js";
import FetchSprintController from "../../controller/fetch/FetchSprint.controller.js";
import FetchTaskController from "../../controller/fetch/FetchTask.controller.js";
import FetchMessagesController from "../../controller/fetch/FetchMessages.controller.js";
import FetchConversationsController from "../../controller/fetch/FetchConversatoins.controller.js";
import FetchProjectMembersController from "../../controller/fetch/FetchProjectMembers.controller.js";

const router = Router();

router.post("/project", FetchProjectController);
router.post("/sprint", FetchSprintController);
router.post('/task', FetchTaskController);
router.post("/messages", FetchMessagesController);
router.post("/conversations", FetchConversationsController)
router.post("/project-members", FetchProjectMembersController);

export default router;