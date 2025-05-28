import { Router } from "express";
import projectRouter from "./deleteProjects.js"
import sprintRouter from "./delteSprints.js"
import columnRouter from "./deleteColumns.js"
import taskRouter from "./deleteTasks.js"
import messageRouter from "./deleteMessage.route.js"
import chatRouter from  "./deleteChat.route.js"
import { deleteFile } from "../../controller/upload/upload-s3.controller.js";

const router = Router();

router.use("/project", projectRouter);
router.use("/sprint", sprintRouter);
router.use("/column", columnRouter)
router.use("/task", taskRouter);
router.use("/message", messageRouter)
router.use("/chat", chatRouter);
router.post("/file/:key", deleteFile);


export default router;