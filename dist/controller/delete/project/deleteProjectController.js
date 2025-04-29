import asyncHandler from "../../../utils/asyncHanlder.js";
import db from "../../../utils/db/db.js";
const deleteProjectController = asyncHandler(async (req, res) => {
    const { projectId } = req.body;
    const user = req.user;
    if (!projectId) {
        return res.status(400).json({
            status: "failed",
            statusCode: 400,
            message: "Project ID is required.",
        });
    }
    try {
        // Check if the user is a member of the project
        const member = await db.member.findFirst({
            where: {
                userId: user.id,
                projectId: projectId,
            },
        });
        if (!member) {
            return res.status(403).json({
                status: "failed",
                statusCode: 403,
                message: "You are not a member of this project.",
            });
        }
        if (member.role !== "ADMIN") {
            return res.status(403).json({
                status: "failed",
                statusCode: 403,
                message: "Only admins can delete the project.",
            });
        }
        // Check if the project exists
        const project = await db.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            return res.status(404).json({
                status: "failed",
                statusCode: 404,
                message: "Project not found.",
            });
        }
        // Delete the project
        await db.project.delete({
            where: { id: projectId },
        });
        return res.status(200).json({
            status: "success",
            statusCode: 200,
            message: "Project deleted successfully.",
            data: { projectId },
        });
    }
    catch (error) {
        console.error("Error deleting project:", error);
        return res.status(500).json({
            status: "failed",
            statusCode: 500,
            message: "Internal server error.",
        });
    }
});
export default deleteProjectController;
//# sourceMappingURL=deleteProjectController.js.map