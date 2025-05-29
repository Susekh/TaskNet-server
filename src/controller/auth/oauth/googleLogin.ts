import { CookieOptions, Request, Response } from "express";
import asyncHandler from "../../../utils/asyncHanlder.js";
import db from "../../../utils/db/db.js";
import getGoogleOauthTokens from "../../../utils/getGoogleOauthTokens.js";
import jwt from "jsonwebtoken";
import { generateAccessAndRefereshTokens } from "../signInController.js";
import generatePasswords from "../../../utils/generatePasswords.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

interface GoogleUser {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string | null;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string | null;
  given_name: string;
  iat: number;
  exp: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  createdAt: Date;
  imgUrl: string;
  projects: any;
  members: any;
}

interface ResponsePayload {
  data: {
    status: string;
    statusCode: number;
    user: User;
    successMsg: string;
  };
  accessToken: string;
  refreshToken: string;
}

const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  try {
    const code = req.body.code;

    const { id_token, access_token } = await getGoogleOauthTokens(code);

    console.log({ id_token, access_token });

    const googleUser = jwt.decode(id_token) as GoogleUser;

    console.log("Google user ::", googleUser);

   
    const email = googleUser.email ?? "";
    const name = googleUser.name ?? "";
    const imgUrl = googleUser.picture ?? "";

    // Find existing user by email
    const userFromDb = await db.user.findFirst({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
        imgUrl: true,
        dob: true,
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
        gender: true,
      },
    });

    let responsePayload: ResponsePayload;

    if (!userFromDb) {
      // Make sure username is unique
      let username = googleUser.given_name ?? "user";

      let usernameExists = await db.user.findUnique({ where: { username } });
      while (usernameExists) {
        username = `${name}-${uuidv4().split("-")[0]}`;
        usernameExists = await db.user.findUnique({ where: { username } });
      }


      const password = generatePasswords();
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = await db.user.create({
        data: {
          username,
          email,
          name,
          password: hashedPassword,
          imgUrl,
        },
      });

      console.log("New User ::", newUser);

      const tokens = await generateAccessAndRefereshTokens(res, newUser);
      if (!tokens) {
        return res.status(500).json({ error: "Failed to generate tokens" });
      }
      const { accessToken, refreshToken } = tokens;

      responsePayload = {
        data: {
          status: "success",
          statusCode: 201,
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email ?? "",
            name: newUser.name,
            createdAt: newUser.createdAt,
            imgUrl: newUser.imgUrl ?? "",
            projects: [],
            members: [],
          },
          successMsg: "Logged in successfully.",
        },
        accessToken,
        refreshToken,
      };
    } else {
      const safeUser: User = {
        ...userFromDb,
        email: userFromDb.email ?? "",
        imgUrl: userFromDb.imgUrl ?? "",
      };

      const tokens = await generateAccessAndRefereshTokens(res, userFromDb);
      if (!tokens) {
        return res.status(500).json({ error: "Failed to generate tokens" });
      }
      const { accessToken, refreshToken } = tokens;

      responsePayload = {
        data: {
          status: "success",
          statusCode: 201,
          user: safeUser,
          successMsg: "Logged in successfully.",
        },
        accessToken,
        refreshToken,
      };
    }

    const options: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };

    return res
      .status(201)
      .cookie("accessToken", responsePayload.accessToken, options)
      .cookie("refreshToken", responsePayload.refreshToken, options)
      .json(responsePayload.data);
  } catch (error) {
    console.log("Err at google login :: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default googleLogin;
