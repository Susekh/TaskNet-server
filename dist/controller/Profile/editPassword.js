import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
import bcrypt from 'bcryptjs';
const editPassword = asyncHandler(async (req, res) => {
    const { password, newPassword, id } = req.body.body;
    let formErr = [
        { field: "password", isErr: false, msg: "" },
        { field: "id", isErr: false, msg: "" },
    ];
    try {
        const user = await db.user.findFirst({
            where: {
                id: id
            },
            select: {
                password: true
            }
        });
        if (!user) {
            return res.status(404).json({
                status: "failed",
                statusCode: 404,
                errMsgs: { formErr: [...formErr, { field: "username", isErr: true, msg: "User not found" }] }
            });
        }
        console.log("password from client ::", password);
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                status: "failed",
                statusCode: 400,
                errMsgs: { formErr: [...formErr, { field: "password", isErr: true, msg: "Password is incorrect" }] }
            });
        }
        if (isPasswordCorrect) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.user.update({
                where: {
                    id: id
                },
                data: {
                    password: hashedPassword
                }
            });
        }
        res.status(201).json({
            status: "success",
            statusCode: 201,
            successMsg: "Password changed successfully"
        });
    }
    catch (error) {
        res.status(500).json({
            status: "failed",
            statusCode: 500,
            errMsgs: { otherErr: { isErr: true, msg: "Couldn't change password" } }
        });
        console.log("Err at change Password ::", error);
    }
});
export default editPassword;
//# sourceMappingURL=editPassword.js.map