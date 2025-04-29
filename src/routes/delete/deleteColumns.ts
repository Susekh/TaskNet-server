import { Router } from "express";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";
import deleteColumnController from "../../controller/delete/sprint/column/deleteColumnController.js";

const router = Router();

router.post("/delete-column", verifyJWTForProfile, deleteColumnController);

export default router;