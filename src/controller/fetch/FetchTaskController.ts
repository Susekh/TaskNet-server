import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";

const FetchTaskController = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.body;
  const userId = req.user?.id; // Assuming req.user is populated via auth middleware

  if (!taskId) {
    return res.status(400).json({
      status: "failed",
      statusCode: 400,
      message: "Task ID is required.",
    });
  }

  try {
    // Fetch Task with related data including project members
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        messages: true,
        members: {
          include: {
            user: {
              select: {
                name: true,
                imgUrl: true,
                username: true,
              },
            },
          },
        },
        column: {
          include: {
            sprint: {
              include: {
                project: {
                  include: {
                    members: true, // This gives access to userId of each member
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        status: "failed",
        statusCode: 404,
        message: "Task not found.",
      });
    }

    // Check if user is a member of the project
    const projectMembers = task.column.sprint.project.members;
    const isUserMember = projectMembers.some(
      (member) => member.userId === userId
    );

    if (!isUserMember) {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        message: "You are not authorized to view this task.",
      });
    }

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Task fetched successfully.",
      task,
    });
  } catch (error: unknown) {
    console.error("Error fetching Task :", error);

    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    res.status(500).json({
      status: "failed",
      statusCode: 500,
      message: "Internal server error.",
      error: errorMessage,
    });
  }
});

export default FetchTaskController;
