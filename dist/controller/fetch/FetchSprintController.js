import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
const FetchSprintController = asyncHandler(async (req, res) => {
    const { sprintId } = req.body;
    const user = req.user;
    if (!sprintId) {
        return res.status(400).json({
            status: "failed",
            statusCode: 400,
            message: "Sprint ID is required.",
        });
    }
    if (!user) {
        return res.status(401).json({
            status: "failed",
            statusCode: 401,
            message: "User is not authenticated.",
        });
    }
    try {
        // Fetch sprint with its project and project members
        const sprint = await db.sprint.findUnique({
            where: { id: sprintId },
            include: {
                project: {
                    include: {
                        members: true,
                    },
                },
                columns: {
                    include: {
                        tasks: {
                            include: {
                                members: true,
                                column: true,
                            },
                        },
                    },
                },
            },
        });
        if (!sprint) {
            return res.status(404).json({
                status: "failed",
                statusCode: 404,
                message: "Sprint not found.",
            });
        }
        // Validate user is a member of the sprint's project
        const isUserMember = sprint.project.members.some((member) => member.userId === user.id);
        if (!isUserMember) {
            return res.status(403).json({
                status: "failed",
                statusCode: 403,
                message: "User is not a member of the project that owns this sprint.",
            });
        }
        // Sort the tasks array inside each column by the 'order' property
        if (sprint.columns) {
            sprint.columns.forEach((column) => {
                if (column.tasks) {
                    column.tasks.sort((taskA, taskB) => taskA.order - taskB.order);
                }
            });
        }
        res.status(200).json({
            status: "success",
            statusCode: 200,
            message: "Sprint fetched successfully.",
            sprint: sprint,
        });
    }
    catch (error) {
        console.error("Error fetching sprint:", error);
        let errorMessage = "Unknown error";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        res.status(500).json({
            status: "failed",
            statusCode: 500,
            message: "Internal server error.",
            error: errorMessage,
        });
    }
});
export default FetchSprintController;
//# sourceMappingURL=FetchSprintController.js.map