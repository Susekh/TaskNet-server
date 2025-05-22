import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../utils/s3.js";
const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "video/mp4",
    "video/quicktime",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
// Multer config
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET,
        key: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        },
    }),
    limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
    fileFilter: (req, file, cb) => {
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            const error = new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname);
            cb(error);
        }
    },
});
export default upload;
//# sourceMappingURL=multer.s3.middleware.js.map