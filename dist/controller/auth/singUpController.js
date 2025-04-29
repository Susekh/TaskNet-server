import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
import bcrypt from "bcryptjs";
import { v4 as uuidV4 } from "uuid";
const singUpController = asyncHandler(async (req, res) => {
    let formErr = [
        { field: "username", isErr: false, msg: "" },
        { field: "password", isErr: false, msg: "" },
        { field: "name", isErr: false, msg: "" },
        { field: "email", isErr: false, msg: "" }
    ];
    try {
        const { username, name, password, email } = req.body;
        console.log("at controller :: ", req.body);
        const existingUser = await db.user.findUnique({
            where: { username: username },
        });
        if (existingUser) {
            return res.json({
                status: "failed",
                statusCode: 400,
                errMsgs: { formErr: [...formErr, { field: "username", isErr: true, msg: "Username already exists." }] }
            });
        }
        ;
        const emailExists = await db.user.findUnique({
            where: { email: email }
        });
        if (emailExists) {
            return res.json({
                status: "failed",
                statusCode: 400,
                errMsgs: { formErr: [...formErr, { field: "email", isErr: true, msg: "Email already exists." }] }
            });
        }
        ;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await db.user.create({
            data: {
                id: uuidV4(),
                username: username,
                email: email,
                name: name,
                password: hashedPassword,
            }
        });
        console.log("User after db update :: ", user);
        res.status(201).json({
            status: "success",
            statusCode: 201,
            successMsg: "User registered succesfully."
        });
    }
    catch (error) {
        res.status(500).json({
            status: "failed",
            statusCode: 500,
            errMsgs: { otherErr: { isErr: true, msg: `Server Error :: code :: ${500} :: ${error}` } }
        });
    }
});
export default singUpController;
//# sourceMappingURL=singUpController.js.map