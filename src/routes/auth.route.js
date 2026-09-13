import  {
    registerUserWithPasword , 
    registerUserWithGoogle ,
     loginUserWithPassword ,
      loggoutUser , 
      getMe
      , emailVerification
    }
 from "../controllers/auth.js";
import {validateUserWithPassword  , validateLoginSchema , resetPasswordValidate , forgotPasswordValidate}from "../middleware/validators.js";
import asyncHandler from '../utils/asyncHandler.js'
import refreshAccessToken from '../controllers/refreshToken.js'
import  { verifyUser, verifyRefreshToken } from "../middleware/auth.middleware.js";
import {Router} from 'express';
import {changePassword , forgotPassword  , resetPassword} from "../controllers/password.js";
import {  loginLimiter, registerLimiter , authLimiter } from '../utils/limiter.js'
import { upload } from "../middleware/upload.js";
const auth = Router();

auth.post('/register' , validateUserWithPassword  ,upload.single('profileImg'),registerLimiter  , asyncHandler(registerUserWithPasword))
auth.get(
    '/email-verification/:token',
    asyncHandler(emailVerification)
);
auth.post('/google' ,  asyncHandler(registerUserWithGoogle))
auth.post('/login' ,validateLoginSchema ,loginLimiter ,  asyncHandler(loginUserWithPassword))
auth.get('/refresh-token' ,verifyRefreshToken,  asyncHandler(refreshAccessToken))
auth.post('/logg-out' , verifyUser , asyncHandler(loggoutUser));
auth.get('/getMe' , verifyUser , asyncHandler(getMe));




auth.put('/change-password' ,  verifyUser , resetPasswordValidate , authLimiter , asyncHandler(changePassword))
auth.post('/forgot-password' ,forgotPasswordValidate, authLimiter ,  asyncHandler(forgotPassword));
auth.put('/reset-password/:token' , resetPasswordValidate, authLimiter, asyncHandler(resetPassword))
export default auth