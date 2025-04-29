import { MemberRole } from "@prisma/client";
import asyncHandler from "../../../../utils/asyncHanlder.js";
import db from "../../../../utils/db/db.js";

const deleteColumnController = asyncHandler(async (req, res) => {
    const { columnId } = req.body;
    const user = req.user;

    try {
        const column = await db.column.findUnique({
            where: { id: columnId },
            include: { sprint: { select: { projectId: true }} },
        });

        if (!column) {
            return res.status(404).json({
                status: "failed",
                statusCode: 404,
                errMsgs: { otherErr: { isErr: true, msg: "Column not found." } },
            });
        }

        const member = await db.member.findFirst({
            where: {
                userId: user.id,
                projectId: column.sprint.projectId,
            },
        });

        if (!member || !(member.role === MemberRole.ADMIN || member.role === MemberRole.MODERATOR)) {
            return res.status(403).json({
                status: "failed",
                statusCode: 403,
                errMsgs: { otherErr: { isErr: true, msg: "You do not have permission to delete columns." } },
            });
        }

        await db.column.delete({
            where: { id: columnId },
        });

        const sprint = await db.sprint.findUnique({
            where: { id: column.sprintId },
            include: {
                columns: true,
            },
        });

        res.status(200).json({
            status: "success",
            statusCode: 200,
            message: "Column deleted successfully.",
            sprint: sprint,
        });
    } catch (error) {
        console.error("Error deleting column:", error);
        res.status(500).json({
            status: "failed",
            statusCode: 500,
            errMsgs: { otherErr: { isErr: true, msg: `Server Error: ${error.message}` } },
        });
    }
});

export default deleteColumnController;
