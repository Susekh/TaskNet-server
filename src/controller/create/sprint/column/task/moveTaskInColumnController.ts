import asyncHandler from "../../../../../utils/asyncHanlder.js";
import db from "../../../../../utils/db/db.js";

const moveTaskInColumnController = asyncHandler(async (req, res) => {
  const {
    previousColumnId,
    targetColumnId,
    taskId,
    order,
  } = req.body;

  // Validate input
  if (
    !previousColumnId ||
    !targetColumnId ||
    !taskId ||
    order === undefined
  ) {
    return res.status(400).json({
      status: "failed",
      statusCode: 400,
      errMsgs: {
        otherErr: { isErr: true, msg: "Missing required fields." },
      },
    });
  }

  const task = await db.task.findUnique({ where: { id: taskId } });

  if (!task) {
    return res.status(404).json({
      status: "failed",
      statusCode: 404,
      errMsgs: { otherErr: { isErr: true, msg: "Task not found." } },
    });
  }

  const sourceColumnId = previousColumnId;
  const isSameColumn = sourceColumnId === targetColumnId;

  try {
    await db.$transaction(async (tx) => {
      // Adjust order in source column if moving to another column
      if (!isSameColumn) {
        await tx.task.updateMany({
          where: {
            columnId: sourceColumnId,
            order: {
              gt: task.order,
            },
          },
          data: {
            order: {
              decrement: 1,
            },
          },
        });
      } else {
        // If same column: reordering logic
        const direction = order > task.order ? -1 : 1;
        await tx.task.updateMany({
          where: {
            columnId: targetColumnId,
            order: {
              gte: Math.min(order, task.order),
              lte: Math.max(order, task.order),
              not: task.order,
            },
          },
          data: {
            order: {
              increment: direction,
            },
          },
        });
      }

      // Shift other tasks in target column if different column
      if (!isSameColumn) {
        await tx.task.updateMany({
          where: {
            columnId: targetColumnId,
            order: {
              gte: order,
            },
          },
          data: {
            order: {
              increment: 1,
            },
          },
        });
      }

      // Update task's column and order
      await tx.task.update({
        where: { id: taskId },
        data: {
          columnId: targetColumnId,
          order,
        },
      });
    });

    // Fetch updated column + sprint
    const column = await db.column.findUnique({
      where: { id: targetColumnId },
      include: { tasks: true },
    });

    const sprint = await db.sprint.findUnique({
      where: { id: column.sprintId },
      include: {
        columns: {
          include: {
            tasks: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Task moved successfully.",
      column,
      sprint,
    });
  } catch (error) {
    console.error("Error moving task:", error);
    res.status(500).json({
      status: "failed",
      statusCode: 500,
      errMsgs: {
        otherErr: { isErr: true, msg: `Server error: ${error.message}` },
      },
    });
  }
});

export default moveTaskInColumnController;
