import asyncHandler from "../../../utils/asyncHanlder.js";
import db from "../../../utils/db/db.js";
const deleteProjectMemberController = asyncHandler(async (req, res) => {
    const { memberId } = req.body;
    const user = req.user;
    if (!memberId) {
        return res.status(400).json({
            status: "failed",
            statusCode: 400,
            message: "Member ID is required.",
        });
    }
    try {
        // Get the member to be deleted
        const targetMember = await db.member.findUnique({
            where: { id: memberId },
            include: { project: true },
        });
        if (!targetMember) {
            return res.status(404).json({
                status: "failed",
                statusCode: 404,
                message: "Member not found.",
            });
        }
        // Get the current user's role in this project
        const requestingMember = await db.member.findFirst({
            where: {
                userId: user.id,
                projectId: targetMember.projectId,
            },
        });
        if (!requestingMember) {
            return res.status(403).json({
                status: "failed",
                statusCode: 403,
                message: "You are not a member of this project.",
            });
        }
        if (requestingMember.role !== "ADMIN" ||
            requestingMember.id === memberId) {
            return res.status(403).json({
                status: "failed",
                statusCode: 403,
                message: "You do not have permission to remove this member.",
            });
        }
        // Delete the member
        await db.member.delete({ where: { id: memberId } });
        return res.status(200).json({
            status: "success",
            statusCode: 200,
            message: "Member removed successfully.",
            data: { memberId },
        });
    }
    catch (error) {
        console.error("Error deleting project member:", error);
        return res.status(500).json({
            status: "failed",
            statusCode: 500,
            message: "Internal server error.",
        });
    }
});
export default deleteProjectMemberController;
//# sourceMappingURL=deleteProjectMemberController.js.map