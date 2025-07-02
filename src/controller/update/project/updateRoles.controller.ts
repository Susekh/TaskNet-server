import { Request, Response } from "express";
import asyncHandler from "../../../utils/asyncHanlder.js";
import db from "../../../utils/db/db.js";
import { MemberRole } from "@prisma/client";

type RoleUpdateBody = {
  memberId: string;
  newRole: "ADMIN" | "MODERATOR" | "CONTRIBUTER";
};

const updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const { memberId, newRole }: RoleUpdateBody = req.body;
  const userId = req.user?.id;

  if (!memberId || !newRole) {
    return res.status(400).json({
      status: "failed",
      statusCode: 400,
      msg: "Required fields missing in request.",
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

  const validRoles = ["ADMIN", "MODERATOR", "CONTRIBUTER"] as const;
  if (!validRoles.includes(newRole as any)) {
    return res.status(400).json({
      status: "failed",
      statusCode: 400,
      msg: "Invalid role specified.",
      errMsgs: {
        newRole: {
          isErr: true,
          msg: "Invalid role specified. Must be ADMIN, MODERATOR, or CONTRIBUTER.",
        },
      },
    });
  }

  if (!userId) {
    return res.status(401).json({
      status: "failed",
      statusCode: 401,
      msg: "Authentication required.",
      errMsgs: {
        auth: {
          isErr: true,
          msg: "Authentication required.",
        },
      },
    });
  }

  try {
    const targetMember = await db.member.findUnique({
      where: { id: memberId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!targetMember) {
      return res.status(404).json({
        status: "failed",
        statusCode: 404,
        msg: "Member not found.",
        errMsgs: {
          memberId: {
            isErr: true,
            msg: "Member not found.",
          },
        },
      });
    }

    const actingMember = targetMember.project.members.find(
      (member) => member.user.id === userId
    );

    if (!actingMember) {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        msg: "You are not a member of this project.",
        errMsgs: {
          permission: {
            isErr: true,
            msg: "You are not a member of this project.",
          },
        },
      });
    }

    if (targetMember.userId === userId) {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        msg: "You cannot change your own role.",
        errMsgs: {
          permission: {
            isErr: true,
            msg: "You cannot change your own role.",
          },
        },
      });
    }

    if (actingMember.role !== "ADMIN") {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        msg: "Only ADMINs can change member roles.",
        errMsgs: {
          permission: {
            isErr: true,
            msg: "Only ADMINs can change member roles.",
          },
        },
      });
    }

    if (targetMember.role === "ADMIN" && newRole !== "ADMIN") {
      const adminCount = targetMember.project.members.filter(
        (member) => member.role === "ADMIN"
      ).length;

      if (adminCount <= 1) {
        return res.status(409).json({
          status: "failed",
          statusCode: 409,
          msg: "Cannot remove the last admin from the project.",
          errMsgs: {
            business: {
              isErr: true,
              msg: "Cannot remove the last admin from the project. Promote another member to admin first.",
            },
          },
        });
      }
    }

    if (targetMember.role === "ADMIN" && newRole !== "ADMIN" && targetMember.userId === userId) {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        msg: "You cannot demote yourself as an admin.",
        errMsgs: {
          permission: {
            isErr: true,
            msg: "You cannot demote yourself as an admin.",
          },
        },
      });
    }

    if (targetMember.role === newRole) {
      return res.status(200).json({
        status: "success",
        statusCode: 200,
        msg: `Member already has role '${newRole}'`,
        message: `No change required — member already has role '${newRole}'`,
        data: {
          memberId: targetMember.id,
          userId: targetMember.userId,
          currentRole: targetMember.role,
          projectId: targetMember.project.id,
        },
      });
    }

    const updatedMember = await db.$transaction(async (tx) => {
      const currentMember = await tx.member.findUnique({
        where: { id: memberId },
        select: { id: true, role: true, userId: true },
      });

      if (!currentMember || currentMember.role !== targetMember.role) {
        throw new Error("Member state has changed during update");
      }

      return await tx.member.update({
        where: { id: memberId },
        data: {
          role: newRole as MemberRole,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      msg: `Member role updated to ${newRole}`,
      message: `Member role successfully updated from ${targetMember.role} to ${newRole}`,
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Member state has changed")) {
        return res.status(409).json({
          status: "failed",
          statusCode: 409,
          msg: "Member role was modified by another process.",
          errMsgs: {
            concurrency: {
              isErr: true,
              msg: "Member role was modified by another process. Please refresh and try again.",
            },
          },
        });
      }
    }

    return res.status(500).json({
      status: "failed",
      statusCode: 500,
      msg: "Unexpected server error occurred.",
      errMsgs: {
        server: {
          isErr: true,
          msg: "An unexpected error occurred while updating member role. Please try again.",
        },
      },
    });
  }
});

export default updateMemberRole;
