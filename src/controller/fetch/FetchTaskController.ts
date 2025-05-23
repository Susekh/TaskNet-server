import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";

const FetchTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({
        status: "failed",
        statusCode: 400,
        message: "Task ID is required.",
      });
    }

    try {
      // Fetch Task by ID
      const task = await db.task.findUnique({
        where: {
          id: taskId,
        },
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
          column: true,
        },
      });

      if (!task) {
        return res.status(404).json({
          status: "failed",
          statusCode: 404,
          message: "Task not found.",
        });
      }

      res.status(200).json({
        status: "success",
        statusCode: 200,
        message: "Task fetched successfully.",
        task: task,
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
  }
);

export default FetchTaskController;
