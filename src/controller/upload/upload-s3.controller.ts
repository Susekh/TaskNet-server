import { Request, Response, NextFunction } from "express";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import s3 from "../../utils/s3.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import asyncHandler from "../../utils/asyncHanlder.js";

// Extend Express.Multer.File to include S3 fields you use
interface MulterS3File extends Express.Multer.File {
  location: string;
  key: string;
}

const uploadSingleFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file as MulterS3File | undefined;

    if (!file) {
      throw new ApiError(400, "No file uploaded", [], true);
    }

    const { location, key, mimetype, originalname } = file;

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
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return next(error);
    }
    const message = error instanceof Error ? error.message : "Something went wrong during upload";
    return next(
      new ApiError(
        500,
        message,
        [],
        true
      )
    );
  }
});

const uploadMultipleFiles = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as MulterS3File[] | undefined;

    if (!files || files.length === 0) {
      throw new ApiError(400, "No files uploaded", [], true);
    }

    const uploadedFiles = files.map((file) => ({
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
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return next(error);
    }
    const message = error instanceof Error ? error.message : "Something went wrong during upload";
    return next(
      new ApiError(
        500,
        message,
        [],
        true
      )
    );
  }
});


const deleteFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;

    if (!key) {
      throw new ApiError(400, "File key is required", [], true);
    }

    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    };

    const result = await s3.send(new DeleteObjectCommand(deleteParams));

    return res.status(200).json(
      new ApiResponse(200, { key }, "File deleted successfully")
    );
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return next(error);
    }
    const message = error instanceof Error ? error.message : "Something went wrong during deletion";
    return next(
      new ApiError(
        500,
        message,
        [],
        true
      )
    );
  }
});

export { uploadSingleFile, uploadMultipleFiles, deleteFile };
