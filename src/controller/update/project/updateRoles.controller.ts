import { Request, Response } from "express";
import asyncHandler from "../../../utils/asyncHanlder.js";
import db from "../../../utils/db/db.js";
import { MemberRole } from "@prisma/client";

type RoleUpdateBody = {
  memberId: string;
  newRole: "ADMIN" | "MODERATOR" | "CONTRIBUTOR";
};

// Role hierarchy for validation
const ROLE_HIERARCHY = {
  ADMIN: 3,
  MODERATOR: 2,
  CONTRIBUTOR: 1,
} as const;

const updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const { memberId, newRole }: RoleUpdateBody = req.body;
  const userId = req.user?.id;

  console.log("Update Role Request Body:", req.body);

  // Basic validation
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

  // Validate role format
  const validRoles = ["ADMIN", "MODERATOR", "CONTRIBUTOR"] as const;
  if (!validRoles.includes(newRole as any)) {
    return res.status(400).json({
      status: "failed",
      statusCode: 400,
      errMsgs: {
        newRole: {
          isErr: true,
          msg: "Invalid role specified. Must be ADMIN, MODERATOR, or CONTRIBUTOR.",
        },
      },
    });
  }

  // Validate user authentication
  if (!userId) {
    return res.status(401).json({
      status: "failed",
      statusCode: 401,
      errMsgs: {
        auth: {
          isErr: true,
          msg: "Authentication required.",
        },
      },
    });
  }

  try {
    // Find the target member with comprehensive data
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
        errMsgs: {
          memberId: {
            isErr: true,
            msg: "Member not found.",
          },
        },
      });
    }

    // Find the acting member (person making the request)
    const actingMember = targetMember.project.members.find(
      (member) => member.user.id === userId
    );

    if (!actingMember) {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        errMsgs: {
          permission: {
            isErr: true,
            msg: "You are not a member of this project.",
          },
        },
      });
    }

    // Prevent self-role modification
    if (targetMember.userId === userId) {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        errMsgs: {
          permission: {
            isErr: true,
            msg: "You cannot change your own role.",
          },
        },
      });
    }

    // Check if acting member has permission to change roles
    if (actingMember.role !== "ADMIN") {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        errMsgs: {
          permission: {
            isErr: true,
            msg: "Only ADMINs can change member roles.",
          },
        },
      });
    }

    // Hierarchy validation: Prevent demoting someone of equal or higher rank
    const actingMemberLevel = ROLE_HIERARCHY[actingMember.role as keyof typeof ROLE_HIERARCHY];
    const targetMemberLevel = ROLE_HIERARCHY[targetMember.role as keyof typeof ROLE_HIERARCHY];
    const newRoleLevel = ROLE_HIERARCHY[newRole];

    if (targetMemberLevel >= actingMemberLevel) {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        errMsgs: {
          permission: {
            isErr: true,
            msg: "You cannot modify the role of someone with equal or higher privileges.",
          },
        },
      });
    }

    // Prevent promoting someone to a role equal to or higher than your own
    if (newRoleLevel >= actingMemberLevel) {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        errMsgs: {
          permission: {
            isErr: true,
            msg: "You cannot promote someone to a role equal to or higher than your own.",
          },
        },
      });
    }

    // Admin protection: Ensure at least one admin remains
    if (targetMember.role === "ADMIN" && newRole !== "ADMIN") {
      const adminCount = targetMember.project.members.filter(
        (member) => member.role === "ADMIN"
      ).length;

      if (adminCount <= 1) {
        return res.status(409).json({
          status: "failed",
          statusCode: 409,
          errMsgs: {
            business: {
              isErr: true,
              msg: "Cannot remove the last admin from the project. Promote another member to admin first.",
            },
          },
        });
      }
    }

    // No-op if role is already set
    if (targetMember.role === newRole) {
      return res.status(200).json({
        status: "success",
        statusCode: 200,
        message: `No change required — member already has role '${newRole}'`,
        data: {
          memberId: targetMember.id,
          userId: targetMember.userId,
          currentRole: targetMember.role,
          projectId: targetMember.project.id,
        },
      });
    }

    // Perform the role update within a transaction for data integrity
    const updatedMember = await db.$transaction(async (tx) => {
      // Double-check the member still exists and hasn't changed
      const currentMember = await tx.member.findUnique({
        where: { id: memberId },
        select: { id: true, role: true, userId: true },
      });

      if (!currentMember || currentMember.role !== targetMember.role) {
        throw new Error("Member state has changed during update");
      }

      // Update the role
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

    console.log(`Role update successful: ${targetMember.user.email} changed from ${targetMember.role} to ${newRole} in project ${targetMember.project.name}`);

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: `Member role successfully updated from ${targetMember.role} to ${newRole}`,
    });

  } catch (error) {
    console.error("Error updating member role:", error);
    
    // Handle specific database constraint errors
    if (error instanceof Error) {
      if (error.message.includes("Member state has changed")) {
        return res.status(409).json({
          status: "failed",
          statusCode: 409,
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