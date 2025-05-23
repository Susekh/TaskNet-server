import axios from "axios";
import asyncHandler from "../../../utils/asyncHanlder.js";
import db from "../../../utils/db/db.js";
import { generateAccessAndRefereshTokens } from "../signInController.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import generatePasswords from "../../../utils/generatePasswords.js";
const githubLogin = asyncHandler(async (req, res) => {
    try {
        const code = req.body.code;
        const client_Id = process.env.CLIENT_ID_GITHUB;
        const client_secret = process.env.CLIENT_SECRET_GITHUB;
        const params = `?client_id=${client_Id}&client_secret=${client_secret}&code=${code}`;
        const tokenResponse = await axios.post(`https://github.com/login/oauth/access_token${params}`, {}, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });
        const tokenData = tokenResponse.data;
        const accessToken = tokenData.access_token;
        if (!accessToken) {
            return res
                .status(400)
                .json({ error: "No access token received from GitHub" });
        }
        const userResponse = await axios.get("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const userData = userResponse.data;
        const user = await db.user.findFirst({
            where: {
                email: userData.email ?? undefined,
            },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                createdAt: true,
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
                                name: true,
                                imageUrl: true,
                                sprints: true,
                            },
                        },
                        assingedIssues: true,
                    },
                },
                dob: true,
                gender: true,
                password: true,
            },
        });
        let responsePayload;
        if (!user) {
            const name = userData.name ?? "";
            const email = userData.email ?? "";
            const imgUrl = userData.avatar_url ?? "";
            let username = userData.login ?? "github-user";
            let usernameExists = await db.user.findUnique({ where: { username } });
            while (usernameExists) {
                username = `${userData.login}-${uuidv4().split("-")[0]}`;
                usernameExists = await db.user.findUnique({ where: { username } });
            }
            const password = generatePasswords();
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await db.user.create({
                data: {
                    id: userData.id,
                    username,
                    email,
                    name,
                    password: hashedPassword,
                    imgUrl,
                },
            });
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
                        email: newUser.email,
                        name: newUser.name,
                        createdAt: newUser.createdAt,
                        imgUrl: newUser.imgUrl,
                        projects: [],
                        members: [],
                    },
                    successMsg: "Logged in successfully.",
                },
                accessToken,
                refreshToken,
            };
        }
        else {
            const safeUser = {
                ...user,
                email: user.email ?? "",
                imgUrl: user.imgUrl ?? "",
                password: user.password ?? undefined,
            };
            const tokens = await generateAccessAndRefereshTokens(res, user);
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
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        };
        return res
            .status(201)
            .cookie("accessToken", responsePayload.accessToken, options)
            .cookie("refreshToken", responsePayload.refreshToken, options)
            .json(responsePayload.data);
    }
    catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
export default githubLogin;
//# sourceMappingURL=githubLogin.js.map