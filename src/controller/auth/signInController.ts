import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
import bcrypt from "bcryptjs";
import { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const generateAccessToken = function (id: number, username: string) {
  return jwt.sign(
    {
      id: id,
      username: username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
export const generateRefreshToken = function (id: number) {
  return jwt.sign(
    {
      id: id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const generateAccessAndRefereshTokens = async (res: Response, user) => {
  try {
    console.log("user at generate :: ", user);

    const accessToken = generateAccessToken(user.id, user.username);
    const refreshToken = generateRefreshToken(user.id);

    await db.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshToken },
    });

    console.log(`access :: ${accessToken} refresh :: ${refreshToken}`);

    return { accessToken, refreshToken };
  } catch (error) {
    res.status(500).json({
      status: "failed",
      statusCode: 500,
      errMsgs: {
        otherErr: {
          isErr: true,
          msg: "can't login user :: caught at generateAccessAndRefereshTokens",
        },
      },
    });
  }
};

const singInController = asyncHandler(async (req: Request, res: Response) => {
  let formErr = [
    { field: "username", isErr: false, msg: "" },
    { field: "name", isErr: false, msg: "" },
    { field: "email", isErr: false, msg: "" },
    { field: "password", isErr: false, msg: "" },
  ];

  try {
    const { username, password, email } = req.body;

    console.log("at controller :: ", req.body);

    const user = await db.user.findFirst({
      where: {
        OR: [{ username: username }, { email: email }],
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        name: true,
        password: true,
        dob: true,
        imgUrl: true,
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

    if (!user) {
      return res.json({
        status: "failed",
        statusCode: 400,
        errMsgs: {
          formErr: [
            ...formErr,
            { field: "username", isErr: true, msg: "User doesn't exists." },
          ],
        },
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.json({
        status: "failed",
        statusCode: 400,
        errMsgs: {
          formErr: [
            ...formErr,
            { field: "password", isErr: true, msg: "Password is incorrect." },
          ],
        },
      });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      res,
      user
    );

    delete user.password;

    console.log("User after db update :: ", user);

    const options: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };

    res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        status: "success",
        statusCode: 201,
        user: user,
        successMsg: "Logged in succesfully.",
      });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      statusCode: 500,
      errMsgs: {
        otherErr: {
          isErr: true,
          msg: `Server Error :: code :: ${500} :: ${error}`,
        },
      },
    });
  }
});

export default singInController;
