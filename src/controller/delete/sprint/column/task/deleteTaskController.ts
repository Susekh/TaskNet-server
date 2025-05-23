import { Request, Response } from "express";
import { MemberRole } from "@prisma/client";
import asyncHandler from "../../../../../utils/asyncHanlder.js";
import db from "../../../../../utils/db/db.js";

const deleteTaskController = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.body;
  const userId = req.user?.id;

  console.log("delete task body ::", req.body);

  if (!taskId) {
    return res.status(400).json({
      status: "failed",
      statusCode: 400,
      errMsgs: {
        taskId: { isErr: true, msg: "Task ID is required." },
      },
    });
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    return res.status(404).json({
      status: "failed",
      statusCode: 404,
      errMsgs: { otherErr: { isErr: true, msg: "Task not found." } },
    });
  }

  const member = await db.member.findFirst({
    where: {
      userId,
      projectId: task.projectId,
    },
  });

  const allowedRoles = new Set<MemberRole>([MemberRole.ADMIN, MemberRole.MODERATOR]);

  if (!member || !allowedRoles.has(member.role)) {
    return res.status(403).json({
      status: "failed",
      statusCode: 403,
      errMsgs: {
        otherErr: {
          isErr: true,
          msg: "Unauthorized: Only ADMIN or MODERATOR can delete tasks.",
        },
      },
    });
  }

  await db.task.delete({
    where: { id: taskId },
  });

  const column = await db.column.findUnique({
    where: { id: task.columnId },
    include: {
      sprint: true,
      tasks: true,
    },
  });

  res.status(200).json({
    status: "success",
    statusCode: 200,
    message: "Task deleted successfully.",
    column,
  });
});

export default deleteTaskController;
