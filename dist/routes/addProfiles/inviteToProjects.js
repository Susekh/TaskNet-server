import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
const inviteToProjectsController = asyncHandler(async (req, res) => {
    try {
        const { userId, projectId } = req.body;
        const project = db.project.findFirst({
            where: {
                userId
            }
        });
        if (project) {
            res.status(200).json({
                message: 'user already a member of the project'
            });
        }
        ;
        const member = db.member.create({
            data: {
                userId,
                projectId,
            }
        });
        res.status(200).json({
            message: 'user added to the project'
        });
    }
    catch (error) {
        console.error("err in invite to projects ::", error);
        res.status(500).json({
            message: 'something went wrong while adding to the project.'
        });
    }
});
export default inviteToProjectsController;
//# sourceMappingURL=inviteToProjects.js.map