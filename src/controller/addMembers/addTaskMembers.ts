import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";

const addMembersToTaskController = asyncHandler(async (req: Request, res: Response) => {
  const { taskId, memberIds } = req.body;

  if (!taskId) {
    return res.status(400).json({
      success: false,
      message: 'Task ID is required.',
    });
  }

  if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one member ID must be provided in an array.',
    });
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      members: true,
      column: {
        include: {
          sprint: {
            include: {
              project: {
                include: { members: true },
              },
            },
          },
        },
      },
    },
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found.',
    });
  }

  const project = task.column.sprint.project;
  const projectMemberIds = project.members.map(member => member.id);
  const invalidMemberIds = memberIds.filter(id => !projectMemberIds.includes(id));

  if (invalidMemberIds.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Some members are not part of the project.',
      invalidMemberIds,
    });
  }

  const existingTaskMemberIds = task.members.map(member => member.id);
  const newMemberIds = memberIds.filter(id => !existingTaskMemberIds.includes(id));

  if (newMemberIds.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'All specified members are already assigned to this task.',
      addedMembers: 0,
    });
  }

  const updatedTask = await db.task.update({
    where: { id: taskId },
    data: {
      members: {
        connect: newMemberIds.map(id => ({ id })),
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              imgUrl: true,
            },
          },
        },
      },
    },
  });

  return res.status(200).json({
    success: true,
    message: 'Members successfully added to the task.',
    addedMembersCount: newMemberIds.length,
    task: {
      id: updatedTask.id,
      name: updatedTask.name,
      members: updatedTask.members.map(member => ({
        id: member.id,
        user: member.user,
      })),
    },
  });
});

export default addMembersToTaskController;
