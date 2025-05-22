import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import asyncHandler from "../../utils/asyncHanlder.js";
import uploadOnCloudinary from "../../utils/cloudinary.js";
const uploadSingleFile = asyncHandler(async (req, res, next) => {
    try {
        // Check if file exists
        if (!req.file) {
            throw new ApiError(400, "No file uploaded", [], true // isOtherError flag
            );
        }
        const localFilePath = req.file.path;
        // Upload to cloudinary
        const cloudinaryResponse = await uploadOnCloudinary(localFilePath);
        if (!cloudinaryResponse) {
            throw new ApiError(500, "File upload to Cloudinary failed", [], true // isOtherError flag
            );
        }
        // Return success response with the updated ApiResponse structure
        return res.status(200).json(new ApiResponse(200, {
            fileUrl: cloudinaryResponse.url,
            public_id: cloudinaryResponse.public_id,
            resource_type: cloudinaryResponse.resource_type
        }, "File uploaded successfully"));
    }
    catch (error) {
        // If it's already an ApiError instance, pass it to next()
        if (error instanceof ApiError) {
            return next(error);
        }
        // Otherwise, create a new ApiError for server error
        return next(new ApiError(500, error.message || "Something went wrong during upload", [], true // isOtherError flag
        ));
    }
});
const uploadMultipleFiles = asyncHandler(async (req, res, next) => {
    try {
        // Check if files exist
        if (!req.files || req.files.length === 0) {
            throw new ApiError(400, "No files uploaded", [], true // isOtherError flag
            );
        }
        const uploadPromises = req.files.map(async (file) => {
            const localFilePath = file.path;
            const cloudinaryResponse = await uploadOnCloudinary(localFilePath);
            if (!cloudinaryResponse) {
                throw new Error(`Failed to upload file: ${file.originalname}`);
            }
            return {
                originalName: file.originalname,
                fileUrl: cloudinaryResponse.url,
                public_id: cloudinaryResponse.public_id,
                resource_type: cloudinaryResponse.resource_type
            };
        });
        const uploadedFiles = await Promise.all(uploadPromises);
        // Return success response
        return res.status(200).json(new ApiResponse(200, { files: uploadedFiles }, "All files uploaded successfully"));
    }
    catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(new ApiError(500, error.message || "Something went wrong during upload", [], true // isOtherError flag
        ));
    }
});
const deleteFile = asyncHandler(async (req, res, next) => {
    try {
        const { public_id } = req.params;
        if (!public_id) {
            throw new ApiError(400, "Public ID is required", [], true // isOtherError flag
            );
        }
        const result = await cloudinary.uploader.destroy(public_id);
        if (result.result !== 'ok') {
            throw new ApiError(500, "Failed to delete file from Cloudinary", [], true // isOtherError flag
            );
        }
        return res.status(200).json(new ApiResponse(200, { public_id }, "File deleted successfully"));
    }
    catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(new ApiError(500, error.message || "Something went wrong during deletion", [], true // isOtherError flag
        ));
    }
});
export { uploadSingleFile, uploadMultipleFiles, deleteFile };
//# sourceMappingURL=upload.controller.js.map