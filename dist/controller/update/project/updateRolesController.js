import asyncHandler from "../../../utils/asyncHanlder.js";
import db from "../../../utils/db/db.js";
const updateMemberRole = asyncHandler(async (req, res) => {
    const { memberId, newRole } = req.body;
    const userId = req.user?.id;
    console.log("Update Role Request Body:", req.body);
    // Validation
    if (!memberId || !newRole) {
        return res.status(400).json({
            status: "failed",
            statusCode: 400,
            errMsgs: {
                memberId: {
                    isErr: !memberId,
                    msg: !memberId ? "Member ID is required." : "",
                },
                newRole: {
                    isErr: !newRole,
                    msg: !newRole ? "New role is required." : "",
                },
            },
        });
    }
    // Validate role value
    const validRoles = ["ADMIN", "MODERATOR", "CONTRIBUTER"];
    if (!validRoles.includes(newRole)) {
        return res.status(400).json({
            status: "failed",
            statusCode: 400,
            errMsgs: {
                newRole: {
                    isErr: true,
                    msg: "Invalid role specified.",
                },
            },
        });
    }
    try {
        // Find the target member and include project details
        const targetMember = await db.member.findUnique({
            where: { id: memberId },
            include: {
                project: {
                    select: {
                        id: true,
                        members: {
                            where: { userId },
                            select: { id: true, role: true }
                        }
                    }
                }
            }
        });
        if (!targetMember) {
            return res.status(404).json({
                status: "failed",
                statusCode: 404,
                errMsgs: {
                    memberId: {
                        isErr: true,
                        msg: "Member not found.",
                    },
                },
            });
        }
        // Check if the requesting user is an ADMIN in this project
        const actingMember = targetMember.project?.members?.[0];
        if (!actingMember || actingMember.role !== "ADMIN") {
            return res.status(403).json({
                status: "failed",
                statusCode: 403,
                errMsgs: {
                    permission: {
                        isErr: true,
                        msg: "Only ADMINs can change roles.",
                    },
                },
            });
        }
        // Check if the role is already set (avoid unnecessary updates)
        if (targetMember.role === newRole) {
            return res.status(200).json({
                status: "success",
                statusCode: 200,
                message: `No change — user already has role '${newRole}'`,
            });
        }
        // Update the member's role
        const updatedMember = await db.member.update({
            where: { id: memberId },
            data: { role: newRole },
        });
        // Return success response
        return res.status(200).json({
            status: "success",
            statusCode: 200,
            message: `Member role updated to ${newRole}`,
            data: updatedMember,
        });
    }
    catch (error) {
        console.error("Error updating member role:", error);
        return res.status(500).json({
            status: "failed",
            statusCode: 500,
            errMsgs: {
                server: {
                    isErr: true,
                    msg: "An error occurred while updating member role.",
                },
            },
        });
    }
});
export default updateMemberRole;
//# sourceMappingURL=updateRolesController.js.map