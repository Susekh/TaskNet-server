import { Router } from "express";
import { verifyJWTForProfile } from "../../middleware/verifyJWTForProfile.js";
import updateColName from "../../controller/delete/sprint/column/updateColNameController.js";
const router = Router();
router.use(verifyJWTForProfile);
router.put('/name', updateColName);
export default router;
//# sourceMappingURL=updateColumns.js.map