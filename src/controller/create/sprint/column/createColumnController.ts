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
                    { field: "name", isErr: true, msg: "name is required." },
                ],
            },
        });
    }

    try {
        // Check if the sprint exists
        const sprint = await db.sprint.findUnique({
            where: { id: sprintId },
        });

        if (!sprint) {
            return res.status(404).json({
                status: "failed",
                statusCode: 404,
                errMsgs: { otherErr: { isErr: true, msg: "Sprint not found." } },
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

        const newSprint = await db.sprint.findUnique({
            where : {
                id : sprintId
            },
            include : {
                columns : {
                    include : {
                        tasks : true
                    }
                }
            }
        });

        res.status(201).json({
            status: "success",
            statusCode: 201,
            message: "Column created successfully.",
            sprint : newSprint,
            column: column,
        });
    } catch (error) {
        console.error("Error creating column:", error);
        res.status(500).json({
            status: "failed",
            statusCode: 500,
            errMsgs: { otherErr: { isErr: true, msg: `Server Error: ${error.message}` } },
        });
    }
});

export default createColumnController;
