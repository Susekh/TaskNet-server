import { Request, Response } from "express";
import asyncHandler from "../../../utils/asyncHanlder.js";
import db from "../../../utils/db/db.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import { ApiError } from "../../../utils/apiError.js";

// Only ADMIN or MODERATOR can update project image
const updateProjectImage = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.body;
  const userId = req.user?.id;

  interface S3File extends Express.Multer.File {
    location: string;
  }

  if (!req.file) {
    throw new ApiError(400, "No file uploaded", [], true);
  }

  if (!projectId) {
    throw new ApiError(400, "Project ID is required", [], true);
  }

  const { location } = req.file as S3File;

  // Fetch the member record of the requesting user for the given project
  const member = await db.member.findFirst({
    where: {
      userId,
      projectId,
    },
  });

  if (!member || !["ADMIN", "MODERATOR"].includes(member.role)) {
    return res.status(403).json({
      status: "failed",
      statusCode: 403,
      errMsgs: {
        permission: {
          isErr: true,
          msg: "Only ADMINs or MODERATORs can update the project image.",
        },
      },
    });
  }

  // Update the image
  const updatedProject = await db.project.update({
    where: { id: projectId },
    data: { imageUrl: location },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedProject, "Project image updated successfully")
    );
});

export default updateProjectImage;
