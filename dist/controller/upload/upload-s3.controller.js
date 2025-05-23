import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import asyncHandler from "../../utils/asyncHanlder.js";
const uploadSingleFile = asyncHandler(async (req, res, next) => {
    try {
        const file = req.file;
        if (!file) {
            throw new ApiError(400, "No file uploaded", [], true);
        }
        const { location, key, mimetype, originalname } = file;
        return res.status(200).json(new ApiResponse(200, {
            fileUrl: location,
            key,
            originalName: originalname,
            mimeType: mimetype,
        }, "File uploaded successfully"));
    }
    catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        const message = error instanceof Error ? error.message : "Something went wrong during upload";
        return next(new ApiError(500, message, [], true));
    }
});
const uploadMultipleFiles = asyncHandler(async (req, res, next) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            throw new ApiError(400, "No files uploaded", [], true);
        }
        const uploadedFiles = files.map((file) => ({
            fileUrl: file.location,
            key: file.key,
            originalName: file.originalname,
            mimeType: file.mimetype,
        }));
        return res.status(200).json(new ApiResponse(200, { files: uploadedFiles }, "All files uploaded successfully"));
    }
    catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        const message = error instanceof Error ? error.message : "Something went wrong during upload";
        return next(new ApiError(500, message, [], true));
    }
});
import s3 from "../../utils/s3.js"; // AWS S3 client
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
const deleteFile = asyncHandler(async (req, res, next) => {
    try {
        const { key } = req.params;
        if (!key) {
            throw new ApiError(400, "File key is required", [], true);
        }
        const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
        };
        const result = await s3.send(new DeleteObjectCommand(deleteParams));
        return res.status(200).json(new ApiResponse(200, { key }, "File deleted successfully"));
    }
    catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        const message = error instanceof Error ? error.message : "Something went wrong during deletion";
        return next(new ApiError(500, message, [], true));
    }
});
export { uploadSingleFile, uploadMultipleFiles, deleteFile };
//# sourceMappingURL=upload-s3.controller.js.map