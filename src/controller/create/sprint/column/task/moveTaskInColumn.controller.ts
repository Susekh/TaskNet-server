import asyncHandler from "../../../../../utils/asyncHanlder.js";
import db from "../../../../../utils/db/db.js";

const moveTaskInColumnController = asyncHandler(async (req, res) => {
  const { previousColumnId, targetColumnId, taskId, order } = req.body;

  if (!previousColumnId || !targetColumnId || !taskId || order === undefined) {
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

    if (!column) {
      return res.status(404).json({
        status: "failed",
        statusCode: 404,
        errMsgs: { otherErr: { isErr: true, msg: "Column not found after update." } },
      });
    }

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
  } catch (error: unknown) {
    console.error("Error moving task:", error);

    const message = error instanceof Error ? error.message : "Unknown server error";

    res.status(500).json({
      status: "failed",
      statusCode: 500,
      errMsgs: {
        otherErr: { isErr: true, msg: `Server error: ${message}` },
      },
    });
  }
});

export default moveTaskInColumnController;
