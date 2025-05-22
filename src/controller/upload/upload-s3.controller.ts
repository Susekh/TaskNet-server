import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import asyncHandler from "../../utils/asyncHanlder.js";

// Single file upload controller
const uploadSingleFile = asyncHandler(async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "No file uploaded", [], true);
    }

    const { location, key, mimetype, originalname } = req.file;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          fileUrl: location,
          key,
          originalName: originalname,
          mimeType: mimetype,
        },
        "File uploaded successfully"
      )
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    return next(
      new ApiError(
        500,
        error.message || "Something went wrong during upload",
        [],
        true
      )
    );
  }
});

// Multiple file upload controller
const uploadMultipleFiles = asyncHandler(async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, "No files uploaded", [], true);
    }

    const uploadedFiles = req.files.map((file) => ({
      fileUrl: file.location,
      key: file.key,
      originalName: file.originalname,
      mimeType: file.mimetype,
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        { files: uploadedFiles },
        "All files uploaded successfully"
      )
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    return next(
      new ApiError(
        500,
        error.message || "Something went wrong during upload",
        [],
        true
      )
    );
  }
});

// Optional: Delete file from S3
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

    return res.status(200).json(
      new ApiResponse(200, { key }, "File deleted successfully")
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    return next(
      new ApiError(
        500,
        error.message || "Something went wrong during deletion",
        [],
        true
      )
    );
  }
});

export { uploadSingleFile, uploadMultipleFiles, deleteFile };
