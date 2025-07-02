import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
import bcrypt from "bcryptjs";
import { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("JWT secret keys are not defined in environment variables");
}

interface User {
  id: string;
  username: string;
  email: string | null;
  createdAt: Date;
  name: string;
  password?: string;
  dob?: Date | null;
  imgUrl?: string | null;
}

export const generateAccessToken = function (id: string, username: string) {
  return jwt.sign(
    { id, username },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

export const generateRefreshToken = function (id: string) {
  return jwt.sign(
    { id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

export const generateAccessAndRefereshTokens = async (
  res: Response,
  user: User
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const accessToken = generateAccessToken(user.id, user.username);
    const refreshToken = generateRefreshToken(user.id);

    await db.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new Error("Failed to generate access and refresh tokens");
  }
};

const singInController = asyncHandler(async (req: Request, res: Response) => {
  const formErr = [
    { field: "username", isErr: false, msg: "" },
    { field: "name", isErr: false, msg: "" },
    { field: "email", isErr: false, msg: "" },
    { field: "password", isErr: false, msg: "" },
  ];

  try {
    const { username, password, email } = req.body;

    if (typeof password !== "string") {
      return res.status(400).json({
        status: "failed",
        statusCode: 400,
        errMsgs: {
          formErr: [
            ...formErr,
            { field: "password", isErr: true, msg: "Password is required." },
          ],
        },
      });
    }

    const user = (await db.user.findFirst({
      where: {
        OR: [{ username }, { email }],
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
      },
    })) as User | null;

    if (!user || !user.password) {
      return res.status(400).json({
        status: "failed",
        statusCode: 400,
        errMsgs: {
          formErr: [
            ...formErr,
            { field: "username", isErr: true, msg: "User doesn't exist." },
          ],
        },
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
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

    const { password: _, ...userWithoutPassword } = user;

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
        user: userWithoutPassword,
        successMsg: "Logged in successfully.",
      });
  } catch (error: unknown) {
    let message = "Server error";
    if (error instanceof Error) message = error.message;

    res.status(500).json({
      status: "failed",
      statusCode: 500,
      errMsgs: {
        otherErr: {
          isErr: true,
          msg: `Server Error :: code :: 500 :: ${message}`,
        },
      },
    });
  }
});

export default singInController;
