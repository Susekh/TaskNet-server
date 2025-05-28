import { Router } from "express";
import deleteMessageController from "../../controller/chat/deleteMessage.controller.js";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";
const router = Router();

router.delete("/:id", verifyJWTForProfile, deleteMessageController);

export default router;