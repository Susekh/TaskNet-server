import { Request, Response, Router } from "express";
import generateBoard from "../../controller/genAi/Gemini/geminiSprintBoard.controller.js";

const router = Router();

router.post("/gemini/generate/sprint/:sprintId", generateBoard);

export default router;