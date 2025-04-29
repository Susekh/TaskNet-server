import { Router } from "express";
import FetchProjectController from "../../controller/fetch/FetchProjectController.js";
import FetchSprintController from "../../controller/fetch/FetchSprintController.js";
import FetchTaskController from "../../controller/fetch/FetchTaskController.js";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";
import FetchMessagesController from "../../controller/fetch/FetchMessagesController.js";
import FetchProjectMembersController from "../../controller/fetch/FetchProjectMembersController.js";
import FetchConversationsController from "../../controller/fetch/FetchConversatoinsController.js";
const router = Router();
router.post("/project", verifyJWTForProfile, FetchProjectController);
router.post("/sprint", verifyJWTForProfile, FetchSprintController);
router.post('/task', verifyJWTForProfile, FetchTaskController);
router.post("/messages", verifyJWTForProfile, FetchMessagesController);
router.post("/conversations", verifyJWTForProfile, FetchConversationsController);
router.post("/project-members", verifyJWTForProfile, FetchProjectMembersController);
export default router;
//# sourceMappingURL=fetchRouter.js.map