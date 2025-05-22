import { MemberRole } from "@prisma/client";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email?: string;
      username: string;
      role?: MemberRole; 
    }

    interface Request {
      user?: UserPayload;
    }
  }
}
