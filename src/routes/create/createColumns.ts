import { Router } from "express";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";
import createColumnController from "../../controller/create/sprint/column/createColumn.controller.js";

const router = Router();

router.post("/newColumn", verifyJWTForProfile, createColumnController);

export default router;