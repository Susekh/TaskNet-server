import asyncHandler from "../../../utils/asyncHanlder.js";
import db from "../../../utils/db/db.js";
import { v4 as uuidv4 } from "uuid";

const createSprintController = asyncHandler(async (req, res) => {
  const { projectId, name, startDate, endDate } = req.body;

  if (!projectId || !name || !startDate || !endDate) {
    return res.status(400).json({
      status: "failed",
      statusCode: 400,
      errMsgs: {
        formErr: [
          { field: "projectId", isErr: true, msg: "Project ID is required." },
          { field: "name", isErr: true, msg: "Sprint name is required." },
          { field: "startDate", isErr: true, msg: "Start date is required." },
          { field: "endDate", isErr: true, msg: "End date is required." },
        ],
      },
    });
  }

  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        sprints: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        status: "failed",
        statusCode: 404,
        errMsgs: { otherErr: { isErr: true, msg: "Project not found." } },
      });
    }

    const member = await db.member.findFirst({
      where: {
        userId: req.user?.id,
        projectId,
      },
    });

    if (!member) {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        errMsgs: {
          otherErr: {
            isErr: true,
            msg: "You are not a member of this project.",
          },
        },
      });
    }

    if (member.role === "CONTRIBUTER") {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        errMsgs: {
          otherErr: {
            isErr: true,
            msg: "Contributors are not allowed to create sprints.",
          },
        },
      });
    }

    if (!project.isPro && project.sprints.length >= 5) {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        errMsgs: {
          otherErr: {
            isErr: true,
            msg: "You have reached the maximum number of sprints allowed for free projects. Please upgrade to Pro to create more.",
          },
        },
      });
    }

    const sprint = await db.sprint.create({
      data: {
        id: uuidv4(),
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        projectId,
      },
    });

    res.status(201).json({
      status: "success",
      statusCode: 201,
      message: "Sprint created successfully.",
      sprint,
    });

  } catch (error: unknown) {
    console.error("Error creating sprint:", error);

    const message = error instanceof Error ? error.message : "Unknown server error";

    res.status(500).json({
      status: "failed",
      statusCode: 500,
      errMsgs: {
        otherErr: { isErr: true, msg: `Server Error: ${message}` },
      },
    });
  }
});

export default createSprintController;
