import { Request, Response } from "express";
import asyncHandler from "../../../utils/asyncHanlder.js";
import db from "../../../utils/db/db.js";


// Define valid statuses
const VALID_STATUSES = ["PLANNED", "ACTIVE", "COMPLETED"] as const;
type SprintStatus = (typeof VALID_STATUSES)[number];

type UpdateSprintStatusBody = {
  sprintId: string;
  newStatus: SprintStatus;
};

const updateSprintStatus = asyncHandler(async (req: Request, res: Response) => {
  const { sprintId, newStatus } = req.body as UpdateSprintStatusBody;
  const userId = req.user?.id;

  // Validation
  if (!sprintId || !newStatus) {
    return res.status(400).json({
      status: "failed",
      statusCode: 400,
      errMsgs: {
        sprintId: {
          isErr: !sprintId,
          msg: !sprintId ? "Sprint ID is required." : "",
        },
        newStatus: {
          isErr: !newStatus,
          msg: !newStatus ? "New status is required." : "",
        },
      },
    });
  }

  if (!VALID_STATUSES.includes(newStatus)) {
    return res.status(400).json({
      status: "failed",
      statusCode: 400,
      errMsgs: {
        newStatus: {
          isErr: true,
          msg: "Invalid status value.",
        },
      },
    });
  }

  // Find the sprint with project info
  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    select: { id: true, projectId: true, status: true },
  });

  if (!sprint) {
    return res.status(404).json({
      status: "failed",
      statusCode: 404,
      errMsgs: {
        sprintId: {
          isErr: true,
          msg: "Sprint not found.",
        },
      },
    });
  }

  // Check if the requesting user is part of the project and authorized
  const member = await db.member.findFirst({
    where: {
      projectId: sprint.projectId,
      userId,
    },
    select: { role: true },
  });

  if (!member || !["ADMIN", "MODERATOR"].includes(member.role)) {
    return res.status(403).json({
      status: "failed",
      statusCode: 403,
      errMsgs: {
        permission: {
          isErr: true,
          msg: "Only ADMIN or MODERATOR can update sprint status.",
        },
      },
    });
  }

  // Skip update if already the same
  if (sprint.status === newStatus) {
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: `No update needed — sprint is already '${newStatus}'.`,
    });
  }

  // Update the sprint
  const updatedSprint = await db.sprint.update({
    where: { id: sprintId },
    data: { status: newStatus },
  });

  return res.status(200).json({
    status: "success",
    statusCode: 200,
    message: `Sprint status updated to '${newStatus}'.`,
    data: updatedSprint,
  });
});

export default updateSprintStatus;
