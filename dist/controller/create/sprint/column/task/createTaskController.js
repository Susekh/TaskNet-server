import { v4 as uuidv4 } from "uuid";
import asyncHandler from "../../../../../utils/asyncHanlder.js";
import db from "../../../../../utils/db/db.js";
const createTaskController = asyncHandler(async (req, res) => {
    const { columnId, name, content, deadline, projectId } = req.body;
    const user = req.user;
    console.log("User at res.user in createTask ::", user);
    // Basic validation
    if (!columnId || !name || !content || !deadline) {
        return res.status(400).json({
            status: "failed",
            statusCode: 400,
            errMsgs: {
                formErr: [
                    { field: "columnId", isErr: true, msg: "Column ID is required." },
                    { field: "name", isErr: true, msg: "Task name is required." },
                    { field: "content", isErr: true, msg: "Task content is required." },
                    { field: "deadline", isErr: true, msg: "Task deadline is required." },
                ],
            },
        });
    }
    try {
        // Check if the column exists
        const column = await db.column.findUnique({
            where: { id: columnId },
        });
        if (!column) {
            return res.status(404).json({
                status: "failed",
                statusCode: 404,
                errMsgs: { otherErr: { isErr: true, msg: "Column not found." } },
            });
        }
        // Determine the next order value
        const tasks = await db.task.findMany({
            where: { columnId },
            orderBy: { order: "desc" },
        });
        const nextOrder = tasks.length ? tasks[0].order + 1 : 1;
        // Create the task
        const task = await db.task.create({
            data: {
                id: uuidv4(),
                projectId: projectId,
                name,
                content,
                deadline: new Date(deadline),
                columnId,
                order: nextOrder,
            },
        });
        const newColumn = await db.column.findUnique({
            where: { id: task.columnId },
            include: { tasks: true },
        });
        const sprint = await db.sprint.findUnique({
            where: { id: column.sprintId },
            include: {
                columns: {
                    include: { tasks: true },
                },
            },
        });
        res.status(201).json({
            status: "success",
            statusCode: 201,
            message: "Task created successfully.",
            task: task,
            sprint: sprint,
            column: newColumn,
        });
    }
    catch (error) {
        console.error("Error creating task:", error);
        const message = error instanceof Error ? error.message : "Unknown server error";
        res.status(500).json({
            status: "failed",
            statusCode: 500,
            errMsgs: { otherErr: { isErr: true, msg: `Server Error: ${message}` } },
        });
    }
});
export default createTaskController;
//# sourceMappingURL=createTaskController.js.map