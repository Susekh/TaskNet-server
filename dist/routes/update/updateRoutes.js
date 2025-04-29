import { Router } from "express";
import updateColRouter from "./Columns/updateColumns.js";
import updateRoleRouter from "./project/updateRolesRoutes.js";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";
const router = Router();
router.use("/cols", verifyJWTForProfile, updateColRouter);
router.use("/project", verifyJWTForProfile, updateRoleRouter);
export default router;
//# sourceMappingURL=updateRoutes.js.map