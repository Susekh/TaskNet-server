import { CookieOptions } from "express";
import asyncHandler from "../../../utils/asyncHanlder.js";
import db from "../../../utils/db/db.js";
import getGoogleOauthTokens from "../../../utils/getGoogleOauthTokens.js";
import jwt from "jsonwebtoken";
import { generateAccessAndRefereshTokens } from "../signInController.js";
import generatePasswords from "../../../utils/generatePasswords.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

interface googleUser {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
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

const googleLogin = asyncHandler(async (req, res) => {
  try {
    const code = req.body.code;

    const { id_token, access_token } = await getGoogleOauthTokens(code);

    console.log({ id_token, access_token });

    const googleUser = jwt.decode(id_token) as googleUser;

    console.log("Google user ::", googleUser);

    const email = googleUser.email;
    const name = googleUser.name;
    const imgUrl = googleUser.picture;

    const user = await db.user.findFirst({
      where: {
        email: email,
      },
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

    if (!user) {
      // check username is unique or not if not then provide an unique one
      let username = googleUser.given_name;

      let usernameExists = await db.user.findUnique({ where: { username } });

      while (usernameExists) {
        username = `${name}-${uuidv4().split("-")[0]}`;
        usernameExists = await db.user.findUnique({ where: { username } });
      }
      // generate a random strong password
      const password = generatePasswords();

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await db.user.create({
        data: {
          username: username,
          email: email,
          name: name,
          password: hashedPassword,
          imgUrl: imgUrl,
        },
      });

      console.log("New User ::", newUser);

      const { accessToken, refreshToken } =
        await generateAccessAndRefereshTokens(res, newUser);

      responsePayload = {
        data: {
          status: "success",
          statusCode: 201,
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            name: newUser.name,
            createdAt: newUser.createdAt,
            imgUrl: newUser.imgUrl,
            projects: [],
            members: [],
          },
          successMsg: "Logged in successfully.",
        },
        accessToken: accessToken,
        refreshToken: refreshToken,
      };
    } else {
      const { accessToken, refreshToken } =
        await generateAccessAndRefereshTokens(res, user);

      responsePayload = {
        data: {
          status: "success",
          statusCode: 201,
          user: user,
          successMsg: "Logged in successfully.",
        },
        accessToken: accessToken,
        refreshToken: refreshToken,
      };
    }

    const options: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };

    res
      .status(201)
      .cookie("accessToken", responsePayload.accessToken, options)
      .cookie("refreshToken", responsePayload.refreshToken, options)
      .json(responsePayload.data);
  } catch (error) {
    console.log("Err at google login :: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default googleLogin;
