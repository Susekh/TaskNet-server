import { v4 as uuidv4 } from "uuid";
import asyncHandler from "../../../../../utils/asyncHanlder.js";
import db from "../../../../../utils/db/db.js";
const createItemController = asyncHandler(async (req, res) => {
    const { columnId, name, content, deadline } = req.body;
    // Basic validation
    if (!columnId || !name || !content || !deadline) {
        return res.status(400).json({
            status: "failed",
            statusCode: 400,
            errMsgs: {
                formErr: [
                    { field: "columnId", isErr: !columnId, msg: "Column ID is required." },
                    { field: "name", isErr: !name, msg: "Item name is required." },
                    { field: "content", isErr: !content, msg: "Content is required." },
                    { field: "deadline", isErr: !deadline, msg: "Deadline is required." },
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
        // Create the item
        const item = await db.task.create({
            data: {
                id: uuidv4(),
                name,
                content,
                deadline: new Date(deadline),
                columnId,
            },
        });
        // Fetch the updated column with its items
        const updatedColumn = await db.column.findUnique({
            where: { id: columnId },
            include: {
                items: true, // Ensure `items` are included in the response
            },
        });
        res.status(201).json({
            status: "success",
            statusCode: 201,
            message: "Item created successfully.",
            column: updatedColumn,
            item: item,
        });
    }
    catch (error) {
        console.error("Error creating item:", error);
        res.status(500).json({
            status: "failed",
            statusCode: 500,
            errMsgs: { otherErr: { isErr: true, msg: `Server Error: ${error.message}` } },
        });
    }
});
export default createItemController;
//# sourceMappingURL=createItemController.js.map