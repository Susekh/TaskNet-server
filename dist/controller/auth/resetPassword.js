import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
import bcrypt from 'bcryptjs';
const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    console.log(" Token and new Pass ::", token, newPassword);
    try {
        const recoverUser = await db.recoverAccount.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date(), // Ensure the token has not expired
                },
            },
            include: { user: true }, // Include the related user
        });
        if (!recoverUser) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        console.log("Recover User ::", recoverUser);
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUser = await db.user.update({
            where: { id: recoverUser.userId },
            data: { password: hashedPassword },
        });
        await db.recoverAccount.update({
            where: { userId: recoverUser.userId },
            data: {
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        console.log("Updated User ::", updatedUser);
        res.status(200).json({ message: 'Password reset successful' });
    }
    catch (error) {
        res.status(404).json({ message: error.message });
    }
});
export default resetPassword;
//# sourceMappingURL=resetPassword.js.map