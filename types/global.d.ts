import { MemberRole } from "@prisma/client";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email?: string;
      username: string;
      role?: MemberRole;
      name: string;         
      createdAt: Date;      
    }

    interface Request {
      user?: UserPayload;
    }
  }
}
