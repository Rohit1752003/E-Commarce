import ApiError from '../utils/apiError.js'
import ApiResponse from '../utils/apiResponce.js'
import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import AppError from '../utils/apiError.js'
import crypto from 'crypto';
import sendEmail from '../utils/email.js';

const changePassword = async (req , res)=>{
    const {oldPassword , newPassword} = req.body;
    const id = req.userId;
    const user = await User.findById(id);
      if (!user.password) {
        throw new ApiError(400, "This account uses Google login");
    }
    const comparePass = await bcrypt.compare(oldPassword , user.password);
    if(!comparePass)throw new AppError(401 , "Password is Incorrect");
 
    const hashedPass = await bcrypt.hash(newPassword , 10);
     user.password  = hashedPass
    await user.save();
    res.status(200).json(new ApiResponse(200 , "Password Changed Succesfully"))
}
const forgotPassword = async(req, res)=>{
    const {email}= req.body;
    const findDetailes = await User.findOne({email});
    if(!findDetailes)throw new ApiError(401 , "email does not exist");

    const resetToken = crypto.randomBytes(32).toString('hex');
    const secureToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const secureExpiry = new Date(Date.now() + 15 *60 * 1000);
    findDetailes.passwordResetToken = secureToken;
  findDetailes.passwordResetExpires = secureExpiry;
  await findDetailes.save();
   const resetUrl = `http://localhost:5000/api/auth/reset-password/${resetToken}`;

 await sendEmail({
    to :findDetailes.email,
    subject : "Password reset Link , Valid for 15 minutes only",
    message: `Click this link to reset your password: ${resetUrl}`, 
 })
  return res
    .status(200)
    .json(new ApiResponse(200, 'Password reset link sent to your email'));

}
const resetPassword = async(req, res)=>{
        const {newPassword}  = req.body;
        const token = req.params.token;

        const hashesToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            passwordResetToken: hashesToken,
            passwordResetExpires: {
            $gt: Date.now(),
         },
    })
    if(!user)throw new AppError(404 , "user does not exist")
    const hashedPass =await  bcrypt.hash(newPassword , 10);
    user.password= hashedPass;
  user.passwordResetToken = undefined;

  user.passwordResetExpires = undefined;

  await user.save();

  res.status(200).json(new ApiResponse(200, 'Password Chnaged Succesfully'));

 }

 
export {changePassword , forgotPassword  , resetPassword }