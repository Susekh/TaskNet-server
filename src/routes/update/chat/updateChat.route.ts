import { Router } from "express";
import updateChatController from "../../../controller/chat/updateChat.controller.js";

const router = Router();


router.put('/:id', updateChatController);


export default router;