import { v4 as uuidv4 } from "uuid";
import asyncHandler from "../../../../utils/asyncHanlder.js";
import db from "../../../../utils/db/db.js";

const createColumnController = asyncHandler(async (req, res) => {
  const { sprintId, name } = req.body;

  // Basic validation
  if (!sprintId || !name) {
    return res.status(400).json({
      status: "failed",
      statusCode: 400,
      errMsgs: {
        formErr: [
          { field: "sprintId", isErr: true, msg: "Sprint ID is required." },
          { field: "name", isErr: true, msg: "Name is required." },
        ],
      },
    });
  }

  try {
    // Fetch the sprint with project and columns
    const sprint = await db.sprint.findUnique({
      where: { id: sprintId },
      include: {
        columns: true,
        project: {
          select: {
            isPro: true,
          },
        },
      },
    });

    if (!sprint) {
      return res.status(404).json({
        status: "failed",
        statusCode: 404,
        errMsgs: { otherErr: { isErr: true, msg: "Sprint not found." } },
      });
    }

    // Enforcing column limit for non-Pro projects
    if (!sprint.project.isPro && sprint.columns.length >= 7) {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        errMsgs: {
          otherErr: {
            isErr: true,
            msg: "You have reached the maximum number of columns allowed for free projects. Please upgrade to Pro to add more.",
          },
        },
      });
    }

    // Create the column
    const column = await db.column.create({
      data: {
        id: uuidv4(),
        name,
        sprintId,
      },
    });

    // Return the updated sprint with its columns and tasks
    const newSprint = await db.sprint.findUnique({
      where: { id: sprintId },
      include: {
        columns: {
          include: {
            tasks: true,
          },
        },
      },
    });

    res.status(201).json({
      status: "success",
      statusCode: 201,
      message: "Column created successfully.",
      sprint: newSprint,
      column: column,
    });
  } catch (error: unknown) {
    console.error("Error creating column:", error);
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    res.status(500).json({
      status: "failed",
      statusCode: 500,
      errMsgs: { otherErr: { isErr: true, msg: `Server Error: ${message}` } },
    });
  }
});

export default createColumnController;
