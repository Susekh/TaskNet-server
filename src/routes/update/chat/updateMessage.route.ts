import { Request, Response, Router } from "express";
import updateMessageController from "../../../controller/chat/updateMessage.controller.js";

const router = Router();


router.put('/:id', updateMessageController);


export default router;