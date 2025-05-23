import { Request, Response } from "express";
import { MemberRole } from "@prisma/client";
import asyncHandler from "../../../../../../utils/asyncHanlder.js";
import db from "../../../../../../utils/db/db.js";

const removeTaskMemberController = asyncHandler(async (req: Request, res: Response) => {
  const { taskId, memberId } = req.body;
  const userId = req.user?.id;

  console.log("remove task member body ::", req.body);

  if (!taskId || !memberId) {
    return res.status(400).json({
      status: "failed",
      statusCode: 400,
      errMsgs: {
        taskId: { isErr: !taskId, msg: "Task ID is required." },
        memberId: { isErr: !memberId, msg: "Member ID is required." },
      },
    });
  }

  try {
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
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

    // Use a Set for allowed roles to fix TS error
    const allowedRoles = new Set<MemberRole>([MemberRole.ADMIN, MemberRole.MODERATOR]);

    if (!member || !allowedRoles.has(member.role)) {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        errMsgs: {
          otherErr: {
            isErr: true,
            msg: "Unauthorized: Only ADMIN or MODERATOR can remove task members.",
          },
        },
      });
    }

    await db.task.update({
      where: { id: taskId },
      data: {
        members: {
          disconnect: { id: memberId },
        },
      },
    });

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Member removed from task successfully.",
    });
  } catch (error: unknown) {
    console.error("Error removing member from task:", error);

    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    res.status(500).json({
      status: "failed",
      statusCode: 500,
      errMsgs: {
        otherErr: {
          isErr: true,
          msg: `Server Error: ${errorMessage}`,
        },
      },
    });
  }
});

export default removeTaskMemberController;
