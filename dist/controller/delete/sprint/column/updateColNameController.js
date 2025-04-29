import db from "../../../../utils/db/db.js";
import asyncHandler from "../../../../utils/asyncHanlder.js";
const updateColName = asyncHandler(async (req, res) => {
    const { name, columnId } = req.body;
    const column = await db.column.findUnique({
        where: { id: columnId },
        include: { sprint: { select: { projectId: true } } },
    });
    if (!column) {
        return res.status(404).json({
            status: "failed",
            statusCode: 404,
            errMsgs: { otherErr: { isErr: true, msg: "Column not found." } },
        });
    }
    const updatedCol = await db.column.update({
        where: { id: columnId },
        data: { name }
    });
    console.log("updatedCOl  ::", updatedCol);
    res.status(200).json({
        status: "success",
        statusCode: 200,
        data: updatedCol
    });
});
export default updateColName;
//# sourceMappingURL=updateColNameController.js.map