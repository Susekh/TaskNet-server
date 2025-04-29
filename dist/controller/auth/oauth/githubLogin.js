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
        console.log("Github Access Token ::", accessToken);
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
                email: userData.email,
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
            },
        });
        let responsePayload;
        if (!user) {
            console.log("User data ::", userData);
            const name = userData.name;
            const email = userData.email;
            // check the img url path is correct
            const imgUrl = userData.avatar_url;
            // check username is unique or not if not then provide an unique one
            let username = userData.login;
            let usernameExists = await db.user.findUnique({ where: { username } });
            while (usernameExists) {
                username = `${userData.username}-${uuidv4().split("-")[0]}`;
                usernameExists = await db.user.findUnique({ where: { username } });
            }
            // generate a random strong password
            const password = generatePasswords();
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await db.user.create({
                data: {
                    id: userData.id,
                    username: username,
                    email: email,
                    name: name,
                    password: hashedPassword,
                    imgUrl: imgUrl,
                },
            });
            const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(res, user);
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
        }
        else {
            const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(res, user);
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
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        };
        res
            .status(201)
            .cookie("accessToken", responsePayload.accessToken, options)
            .cookie("refreshToken", responsePayload.refreshToken, options)
            .json(responsePayload.data);
    }
    catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});
export default githubLogin;
//# sourceMappingURL=githubLogin.js.map