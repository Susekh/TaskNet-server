import { Request, Response } from "express";
import asyncHandler from "../../../utils/asyncHanlder.js";
import db from "../../../utils/db/db.js";

const inviteToProjectsController = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { userId, inviteCode } = req.body;

    // Fetch the project based on inviteCode
    const project = await db.project.findFirst({
      where: {
        inviteCode,
      },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found or invalid invite code.',
      });
    }

    // Check if the user is already a member of the project
    const isMember = project.members.some(member => member.userId === userId);

    if (isMember) {
      return res.status(200).json({
        message: 'User is already a member of the project.',
      });
    }

    // Add the user to the project by creating a new member record
    await db.member.create({
      data: {
        userId,
        projectId: project.id,
        role : "CONTRIBUTER"
      },
    });

    return res.status(200).json({
      message: 'User successfully added to the project.',
    });
  } catch (error) {
    console.error("Error in invite to projects:", error);

    return res.status(500).json({
      message: 'Something went wrong while adding the user to the project.',
    });
  }
});

export default inviteToProjectsController;
