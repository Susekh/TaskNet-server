import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
import { MemberRole } from "@prisma/client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../../utils/s3.js";

const deleteMessageController = asyncHandler(
  async (req: Request, res: Response) => {
    const messageId = req.params.id;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        status: "failed",
        statusCode: 401,
        errMsgs: {
          otherErr: {
            isErr: true,
            msg: "Unauthorized: User not authenticated.",
          },
        },
      });
    }

    const message = await db.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        fileUrl: true,
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
          otherErr: {
            isErr: true,
            msg: "Message not found.",
          },
        },
      });
    }

    const isOwner = message.member.userId === user.id;

    const member = await db.member.findFirst({
      where: {
        userId: user.id,
        projectId: message.member.projectId,
      },
      select: {
        role: true,
      },
    });

    const isAdminOrMod =
      member &&
      (member.role === MemberRole.ADMIN ||
        member.role === MemberRole.MODERATOR);

    if (!isOwner && !isAdminOrMod) {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        errMsgs: {
          otherErr: {
            isErr: true,
            msg: "You do not have permission to delete this message.",
          },
        },
      });
    }

    if (message.fileUrl) {
      const key = message.fileUrl?.split("amazonaws.com/")[1];

      const deleteParams = {
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
      };
      //delete the file associated with it

      await s3.send(new DeleteObjectCommand(deleteParams));
    }

    await db.message.delete({
      where: { id: messageId },
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Message deleted successfully.",
    });
  }
);

export default deleteMessageController;
