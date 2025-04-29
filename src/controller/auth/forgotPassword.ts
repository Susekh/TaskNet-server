import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
import crypto from 'crypto'
import sendMail from "../../utils/mailSender.js";

const forgotPassword = asyncHandler(async (req, res) => {

    const { email } = req.body;

    try {
        const user = await db.user.findUnique({
            where: { email },
          });
    
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
        // Generate reset token and expiry
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // Token valid for 1 hour
    
        // Check if a RecoverUser entry already exists for this user
        let recoverUser = await db.recoverAccount.findUnique({
            where: { userId: user.id },
        });
    
        if (recoverUser) {
            // Update existing recoverUser with new token and expiry
            await db.recoverAccount.update({
              where: { userId: user.id },
              data: {
                resetToken,
                resetTokenExpiry,
              },
            });
          } else {
            // Create a new recoverUser entry
            await db.recoverAccount.create({
              data: {
                userId: user.id,
                resetToken,
                resetTokenExpiry,
              },
            });
          };
    
    
          const resetLink = `${process.env.FRONTEND_URI}/auth/reset-password/${resetToken}`;
    
          const mailHtml = `<p>You requested a password reset</p> 
                            <p>Click <a target="_blank" href="${resetLink}">here</a> to reset your password</p>`

          sendMail(user.email, 'Reset Password', mailHtml);
    
            res.status(200).json({ message: 'Reset email sent' });
    } catch (error) {
        res.status(404).json({ message : 'Mail not sent' })
    }
});

export default forgotPassword;