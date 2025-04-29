import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
const FetchProjectMembersController = asyncHandler(async (req, res) => {
    try {
        const { projectId } = req.body;
        const members = await db.member.findMany({
            where: {
                projectId
            },
            include: {
                user: {
                    select: {
                        name: true,
                        username: true,
                        imgUrl: true
                    }
                }
            }
        });
        res.status(200).json({
            members,
            message: "fetched project members"
        });
    }
    catch (error) {
        console.error("err in fetching project members", error);
        res.status(500).json({
            message: "server error while fetching project members"
        });
    }
});
export default FetchProjectMembersController;
//# sourceMappingURL=FetchProjectMembersController.js.map