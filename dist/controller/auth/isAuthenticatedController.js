import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
const isAuthenticatedController = asyncHandler(async (req, res) => {
    try {
        const user = await db.user.findFirst({
            where: {
                id: req.body.id
            },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                name: true,
                password: true,
                dob: true,
                imgUrl: true,
                projects: {
                    include: {
                        sprints: true,
                        members: true,
                    },
                },
                members: {
                    include: {
                        tasks: true,
                        project: {
                            select: {
                                imageUrl: true,
                                name: true,
                                sprints: true,
                            },
                        },
                        assingedIssues: true,
                    },
                },
                gender: true
            },
        });
        // Clear cookies and send response
        return res
            .status(200)
            .json({ status: "success", user: user, successMsg: "User is Authenticated" });
    }
    catch (error) {
        // Handle any errors
        return res.status(500).json({ status: "failed", errMsgs: { otherErr: "Error occured at checking Authentication." } });
    }
});
export default isAuthenticatedController;
//# sourceMappingURL=isAuthenticatedController.js.map