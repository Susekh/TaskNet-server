import multer, { FileFilterCallback } from "multer";
import multerS3 from "multer-s3";
import { Request } from "express";
import s3 from "../utils/s3.js";
import { S3Client } from "@aws-sdk/client-s3";

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
    s3: s3 as S3Client, 
    bucket: process.env.AWS_S3_BUCKET as string,
    key: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: any, key?: string) => void
    ) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname);
      cb(error);
    }
  },
});

export default upload;
