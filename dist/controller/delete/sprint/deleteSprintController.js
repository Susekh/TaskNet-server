import { MemberRole } from "@prisma/client";
import asyncHandler from "../../../utils/asyncHanlder.js";
import db from "../../../utils/db/db.js";
const deleteSprintController = asyncHandler(async (req, res) => {
    const { sprintId } = req.body;
    const user = req.user;
    console.log("delete sprint body ::", req.body);
    try {
        const sprint = await db.sprint.findUnique({
            where: { id: sprintId },
            select: { projectId: true },
        });
        if (!sprint) {
            return res.status(404).json({
                status: "failed",
                statusCode: 404,
                errMsgs: { otherErr: { isErr: true, msg: "Sprint not found." } },
            });
        }
        const member = await db.member.findFirst({
            where: {
                userId: user.id,
                projectId: sprint.projectId,
            },
        });
        if (!member || !(member.role === MemberRole.ADMIN || member.role === MemberRole.MODERATOR)) {
            return res.status(403).json({
                status: "failed",
                statusCode: 403,
                errMsgs: { otherErr: { isErr: true, msg: "You do not have permission to delete sprints." } },
            });
        }
        await db.sprint.delete({
            where: { id: sprintId },
        });
        res.status(200).json({
            status: "success",
            statusCode: 200,
            message: "Sprint deleted successfully.",
        });
    }
    catch (error) {
        console.error("Error deleting sprint:", error);
        res.status(500).json({
            status: "failed",
            statusCode: 500,
            errMsgs: { otherErr: { isErr: true, msg: `Server Error: ${error.message}` } },
        });
    }
});
export default deleteSprintController;
//# sourceMappingURL=deleteSprintController.js.map