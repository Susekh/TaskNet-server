import asyncHandler from "../../../utils/asyncHanlder.js";
import db from "../../../utils/db/db.js";
import { v4 as uuidv4 } from "uuid";

const createSprintController = asyncHandler(async (req, res) => {
    const { projectId, name, startDate, endDate } = req.body;

    // Basic validation
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
                ]
            }
        });
    }

    try {
        // Check if project exists
        const project = await db.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return res.status(404).json({
                status: "failed",
                statusCode: 404,
                errMsgs: { otherErr: { isErr: true, msg: "Project not found." } }
            });
        }

        // Create the sprint
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
            sprint: sprint,
        });

    } catch (error) {
        console.error("Error creating sprint:", error);
        res.status(500).json({
            status: "failed",
            statusCode: 500,
            errMsgs: { otherErr: { isErr: true, msg: `Server Error: ${error.message}` } }
        });
    }
});

export default createSprintController;
