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
  };

  try {
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

    if (!user) {
      return res.status(401).json({
        status: "failed",
        statusCode: 401,
        errMsgs: {
          otherErr: { isErr: true, msg: "Unauthorized: User not found." },
        },
      });
    }

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

    const isSelf = requestingMember.id === memberId;
    const isTargetContributor = targetMember.role === "CONTRIBUTER";

    if (requestingMember.role === "ADMIN") {
      // Admins can remove anyone
    } else if (requestingMember.role === "MODERATOR") {
      if (!(isSelf || isTargetContributor)) {
        return res.status(403).json({
          status: "failed",
          statusCode: 403,
          message: "Moderators can only remove themselves or contributors.",
        });
      }
    } else if (requestingMember.role === "CONTRIBUTER") {
      if (!isSelf) {
        return res.status(403).json({
          status: "failed",
          statusCode: 403,
          message: "Contributors can only remove themselves.",
        });
      }
    } else {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        message: "Invalid role.",
      });
    }

    await db.member.delete({ where: { id: memberId } });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Member removed successfully.",
      data: { memberId },
    });
  } catch (error) {
    console.error("Error deleting project member:", error);
    return res.status(500).json({
      status: "failed",
      statusCode: 500,
      message: "Internal server error.",
    });
  }
});

export default deleteProjectMemberController;
