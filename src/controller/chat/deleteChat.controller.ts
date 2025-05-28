import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
import { MemberRole } from "@prisma/client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../../utils/s3.js";

const deleteChatController = asyncHandler(
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

    // Fetch the direct message
    const directMessage = await db.directMessage.findUnique({
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

    if (!directMessage) {
      return res.status(404).json({
        status: "failed",
        statusCode: 404,
        errMsgs: {
          otherErr: {
            isErr: true,
            msg: "Direct message not found.",
          },
        },
      });
    }

    const isOwner = directMessage.member.userId === user.id;

    const member = await db.member.findFirst({
      where: {
        userId: user.id,
        projectId: directMessage.member.projectId,
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
            msg: "You do not have permission to delete this direct message.",
          },
        },
      });
    }

    if (directMessage.fileUrl) {
      try {
        const url = new URL(directMessage.fileUrl);
        const key = decodeURIComponent(url.pathname.slice(1));

        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: key,
          })
        );
      } catch (err) {
        console.error("S3 delete error:", err);
      }
    }

    // Perform the delete
    await db.directMessage.delete({
      where: { id: messageId },
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Direct message deleted successfully.",
    });
  }
);

export default deleteChatController;
