import { Router } from "express";
import upload from "../../middleware/multer.s3.middleware.js";
import { uploadMultipleFiles, uploadSingleFile } from "../../controller/upload/upload-s3.controller.js";
import { deleteFile } from "../../controller/upload/upload-cloudinary.controller.js";
import updateProfilePicture from "../../controller/Profile/updateProfilePicture.controller.js";
import updateProjectImage from "../../controller/update/project/updateProjectImage.controller.js";
const router = Router();
router.post("/single", upload.single("file"), uploadSingleFile);
router.post("/multiple", upload.array("files", 10), uploadMultipleFiles);
router.delete("/:key", deleteFile);
router.post("/profile-picture", upload.single("profileImage"), updateProfilePicture);
router.post("/project-image", upload.single("file"), updateProjectImage);
export default router;
//# sourceMappingURL=upload.route.js.map