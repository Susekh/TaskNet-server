import db from "../../../../utils/db/db.js";
import asyncHandler from "../../../../utils/asyncHanlder.js";
const updateColName = asyncHandler(async (req, res) => {
    const { name, columnId } = req.body;
    const userId = req.user?.id;
    console.log("col body ::", req.body);
    if (!name || !columnId) {
        return res.status(400).json({
            status: "failed",
            statusCode: 400,
            errMsgs: {
                name: { isErr: !name, msg: !name ? "Name is required." : "" },
                columnId: { isErr: !columnId, msg: !columnId ? "Column ID is required." : "" },
            },
        });
    }
    const column = await db.column.findUnique({
        where: { id: columnId },
        include: {
            sprint: {
                select: {
                    projectId: true,
                },
            },
        },
    });
    if (!column) {
        return res.status(404).json({
            status: "failed",
            statusCode: 404,
            errMsgs: { otherErr: { isErr: true, msg: "Column not found." } },
        });
    }
    const projectId = column.sprint.projectId;
    const member = await db.member.findFirst({
        where: {
            projectId,
            userId,
        },
    });
    if (!member || !["ADMIN", "MODERATOR"].includes(member.role)) {
        return res.status(403).json({
            status: "failed",
            statusCode: 403,
            message: "Unauthorized: Only ADMIN or CONTRIBUTER can update column name.",
        });
    }
    const updatedCol = await db.column.update({
        where: { id: columnId },
        data: { name },
    });
    console.log("updatedCol ::", updatedCol);
    res.status(200).json({
        status: "success",
        statusCode: 200,
        data: updatedCol,
    });
});
export default updateColName;
//# sourceMappingURL=updateColNameController.js.map