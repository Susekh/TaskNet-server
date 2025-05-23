// import { Request, Response, NextFunction } from "express";
// import { ApiError } from "../../utils/apiError.js";
// import { ApiResponse } from "../../utils/apiResponse.js";
// import asyncHandler from "../../utils/asyncHanlder.js";
// import uploadOnCloudinary from "../../utils/cloudinary.js";
// import cloudinary from "../../utils/cloudinary.js"; 
export {};
// const uploadSingleFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     if (!req.file) {
//       throw new ApiError(400, "No file uploaded", [], true);
//     }
//     const localFilePath = req.file.path;
//     const cloudinaryResponse = await uploadOnCloudinary(localFilePath);
//     if (!cloudinaryResponse) {
//       throw new ApiError(500, "File upload to Cloudinary failed", [], true);
//     }
//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           fileUrl: cloudinaryResponse.url,
//           public_id: cloudinaryResponse.public_id,
//           resource_type: cloudinaryResponse.resource_type,
//         },
//         "File uploaded successfully"
//       )
//     );
//   } catch (error: unknown) {
//     if (error instanceof ApiError) {
//       return next(error);
//     }
//     const message = error instanceof Error ? error.message : "Something went wrong during upload";
//     return next(new ApiError(500, message, [], true));
//   }
// });
// const uploadMultipleFiles = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const files = req.files as Express.Multer.File[] | undefined;
//     if (!files || files.length === 0) {
//       throw new ApiError(400, "No files uploaded", [], true);
//     }
//     const uploadPromises = files.map(async (file: Express.Multer.File) => {
//       const localFilePath = file.path;
//       const cloudinaryResponse = await uploadOnCloudinary(localFilePath);
//       if (!cloudinaryResponse) {
//         throw new Error(`Failed to upload file: ${file.originalname}`);
//       }
//       return {
//         originalName: file.originalname,
//         fileUrl: cloudinaryResponse.url,
//         public_id: cloudinaryResponse.public_id,
//         resource_type: cloudinaryResponse.resource_type,
//       };
//     });
//     const uploadedFiles = await Promise.all(uploadPromises);
//     return res.status(200).json(
//       new ApiResponse(200, { files: uploadedFiles }, "All files uploaded successfully")
//     );
//   } catch (error: unknown) {
//     if (error instanceof ApiError) {
//       return next(error);
//     }
//     const message = error instanceof Error ? error.message : "Something went wrong during upload";
//     return next(new ApiError(500, message, [], true));
//   }
// });
// const deleteFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { public_id } = req.params;
//     if (!public_id) {
//       throw new ApiError(400, "Public ID is required", [], true);
//     }
//     const result = await cloudinary.uploader.destroy(public_id);
//     if (result.result !== "ok") {
//       throw new ApiError(500, "Failed to delete file from Cloudinary", [], true);
//     }
//     return res.status(200).json(
//       new ApiResponse(200, { public_id }, "File deleted successfully")
//     );
//   } catch (error: unknown) {
//     if (error instanceof ApiError) {
//       return next(error);
//     }
//     const message = error instanceof Error ? error.message : "Something went wrong during deletion";
//     return next(new ApiError(500, message, [], true));
//   }
// });
// export { uploadSingleFile, uploadMultipleFiles, deleteFile };
//# sourceMappingURL=upload-cloudinary.controller.js.map