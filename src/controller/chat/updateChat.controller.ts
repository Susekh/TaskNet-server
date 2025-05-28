import { MemberRole } from "@prisma/client";
import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";

const updateChatController = asyncHandler(async (req, res) => {
  const messageId = req.params.id;
  const { content } = req.body;
  console.log("in chat controller ::", messageId, content);
  
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      status: "failed",
      statusCode: 401,
      errMsgs: {
        otherErr: { isErr: true, msg: "Unauthorized: User not authenticated." },
      },
    });
  }

  if (!messageId || !content) {
    return res.status(400).json({
      status: "failed",
      statusCode: 400,
      errMsgs: {
        otherErr: { isErr: true, msg: "Message ID and content are required." },
      },
    });
  }

  try {
    const message = await db.directMessage.findUnique({
      where: { id: messageId },
      include: {
        member: {
          select: {
            userId: true,
            projectId: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({
        status: "failed",
        statusCode: 404,
        errMsgs: {
          otherErr: { isErr: true, msg: "Direct message not found." },
        },
      });
    }

    const isOwner = message.member.userId === user.id;

    const member = await db.member.findFirst({
      where: {
        userId: user.id,
        projectId: message.member.projectId,
      },
    });

    const isAdminOrMod =
      member &&
      (member.role === MemberRole.ADMIN || member.role === MemberRole.MODERATOR);

    if (!isOwner && !isAdminOrMod) {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        errMsgs: {
          otherErr: { isErr: true, msg: "You do not have permission to update this direct message." },
        },
      });
    }

    const updatedMessage = await db.directMessage.update({
      where: { id: messageId },
      data: { content },
    });

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Direct message updated successfully.",
      data: updatedMessage,
    });
  } catch (error: unknown) {
    console.error("Error updating direct message:", error);
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    res.status(500).json({
      status: "failed",
      statusCode: 500,
      errMsgs: {
        otherErr: { isErr: true, msg: `Server Error: ${errorMessage}` },
      },
    });
  }
});

export default updateChatController;
