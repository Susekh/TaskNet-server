import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";

const FetchProjectController = asyncHandler(async (req, res) => {
    const { projectId } = req.body;
    const user = req.user;

    if (!projectId) {
        return res.status(400).json({
            status: "failed",
            statusCode: 400,
            message: "Project ID is required.",
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
        // Fetch project by ID
        const project = await db.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    select: {
                        id: true,
                        role: true,
                        userId: true,
                        projectId: true,
                        tasks : true,
                        createdAt: true,
                        updatedAt: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                email: true,
                                imgUrl: true,
                                dob: true,
                                gender: true,
                                createdAt: true,
                                updatedAt: true,
                            },
                        },
                    },
                },
                sprints: {
                    select: {
                        id: true,
                        name: true,
                        startDate: true,
                        endDate: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                        columns: {
                            select: {
                                id: true,
                                name: true,
                                tasks: true,
                                createdAt: true,
                                updatedAt: true,
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            return res.status(404).json({
                status: "failed",
                statusCode: 404,
                message: "Project not found.",
            });
        }

        const isUserMember = project.members.some((member) => member.userId === user.id);

        if (!isUserMember) {
            return res.status(403).json({
              status: "failed",
              statusCode: 403,
              message: "User is not a member of this project.",
            });
        }

        // Sort the tasks array inside each column by the 'order' property
        if (project.sprints) {
            project.sprints.forEach(sprint => {
                if (sprint.columns) {
                    sprint.columns.forEach(column => {
                        if (column.tasks) {
                            column.tasks.sort((taskA, taskB) => taskA.order - taskB.order);
                        }
                    });
                }
            });
        }

        res.status(200).json({
            status: "success",
            statusCode: 200,
            message: "Project fetched successfully.",
            project: project,
        });

    } catch (error: unknown) {
        console.error("Error fetching project:", error);

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

export default FetchProjectController;
