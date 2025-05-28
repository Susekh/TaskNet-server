import { Router } from "express";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";
import deleteChatController from "../../controller/chat/deleteChat.controller.js";
const router = Router();

router.delete("/:id", verifyJWTForProfile, deleteChatController);

export default router;