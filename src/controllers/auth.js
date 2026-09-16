import AppError from '../utils/apiError.js'
import ApiResponse from '../utils/apiResponce.js'
import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from "google-auth-library";
import { generateToken, refreshToken } from '../utils/jwt.js'
import crypto from 'crypto';
import sendEmail from '../utils/email.js';
import { uploadOnCloudinary , deleteOnCloudinary } from '../utils/cloudinary.js';
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

const emailVerification = async (req, res) => {


    const token = req.params.token;

    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: {
            $gt: Date.now(),
        },
    });

    if (!user) {
        throw new AppError(400, "Invalid or expired verification token");
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, "Email verified successfully"));
};


const sendAuthResponse = async (user, res) => {

    const accessToken = generateToken(user._id);

    const refreshTokenGenerate = refreshToken(user._id);

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    };

    user.refreshToken = refreshTokenGenerate;

    await user.save();

    res.cookie("refreshToken", refreshTokenGenerate, cookieOptions);

    return res.status(200).json(
        new ApiResponse(200, "User Logged-in Successfully", {
            userId: user._id,
            username: user.username,
            email: user.email,
            accessToken
        })
    );
};


const registerUserWithPasword = async (req, res) => {

    const { username, email, password } = req.body;
    const profileImgUrl = req.file ? req.file.path : undefined;

    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        throw new AppError(
            409,
            "User with Email/Username Already Exist"
        );
    }
   

    const hashePass = await bcrypt.hash(password, 10);

    const verificationToken =
        crypto.randomBytes(32).toString('hex');

    const secureToken =
        crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');

    const secureExpiry =
        new Date(Date.now() + 15 * 60 * 1000);
     let uploadResponse = undefined
    if(profileImgUrl){
        try{
           uploadResponse =  await uploadOnCloudinary(profileImgUrl)
             
        }
        catch(err){
            uploadResponse = null
            throw new AppError(500, 'Img Not uploaded', err);
        }
    }
    if(uploadResponse){
        try{
              const createUser = await User.create({
        username,
        email,
        profileImg : uploadResponse ? uploadResponse.secure_url : undefined,
        password: hashePass,
        emailVerificationToken: secureToken,
        emailVerificationExpires: secureExpiry,
        publicId:  uploadResponse ? uploadResponse.public_id : undefined,
    })
    const verificationUrl =
         `http://localhost:5000/api/auth/email-verification/${verificationToken}`;


   


    await sendEmail({
        to: createUser.email,
        subject: "Email Verification Link, Valid for 15 minutes only",
        message: `Click this link to verify your email: ${verificationUrl}`,
    });

    createUser.password = undefined;
      return res
        .status(201)
        .json(new ApiResponse(201, "User created Successfully"));


        }catch(err){
            if(uploadResponse){
                await deleteOnCloudinary(uploadResponse.public_id)
            }
             throw new AppError(500, 'Post not Created');
        }
    }
  
    

}


const registerUserWithGoogle = async (req, res) => {

    // 1. Get credential
    const { credential } = req.body;

    // 2. Verify Google token
    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    // 3. Get verified Google information
    const payload = ticket.getPayload();

    const {
        email,
        name,
        picture,
        sub: googleId
    } = payload;

    if (!email) {
        throw new AppError(400, "Google did not provide email");
    }

    // 4. Find by googleId
    const googleUser = await User.findOne({ googleId });

    if (googleUser) {

        // LOGIN
        return sendAuthResponse(googleUser, res);
    }

    // 5. Find by email
    const existingUser = await User.findOne({ email });

    if (existingUser) {

        // Link Google account
        if (!existingUser.googleId) {

            existingUser.googleId = googleId;

            if (!existingUser.profileImg && picture) {
                existingUser.profileImg = picture;
            }

            await existingUser.save();
        }

        // LOGIN
        return sendAuthResponse(existingUser, res);
    }

    // 6. Completely new user
    const baseUsername = name
        .toLowerCase()
        .replace(/\s+/g, "");

    const uniqueUsername =
        `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;

    const createUser = await User.create({
        email,
        username: uniqueUsername,
        profileImg: picture,
        googleId,
        emailVerified: true
    });

    // LOGIN
    return sendAuthResponse(createUser, res);
};


const loginUserWithPassword = async (req, res) => {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new AppError(401, "Invalid Credentials");
    }

    if (!user.password) {
        throw new AppError(401, "This account Uses Google login");
    }

    const comparePass =
        await bcrypt.compare(password, user.password);

    if (!comparePass) {
        throw new AppError(401, "Invalid Credentials");
    }

     const verificationToken =
        crypto.randomBytes(32).toString('hex');

    const secureToken =
        crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');

    const secureExpiry =
        new Date(Date.now() + 15 * 60 * 1000);
        

        user.emailVerificationToken =  secureToken,
        user.emailVerificationExpires =  secureExpiry,
         await user.save();
       
    
    const verificationUrl =
         `http://localhost:5000/api/auth/email-verification/${verificationToken}`;


   


   
    if (!user.emailVerified) {
        await sendEmail({
        to: user.email,
        subject: "Email Verification Link, Valid for 15 minutes only",
        message: `Click this link to verify your email: ${verificationUrl}`,
    })
    throw new AppError(
        403,
        "Please verify your email before logging in , Email send To user Email Address" 
    );
    }


  
            
         return sendAuthResponse(user, res);
    
   
}


const loggoutUser = async (req, res) => {

    const id = req.userId;

    const user = await User.findById(id);

    user.refreshToken = undefined;

    await user.save();

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    };

    res.clearCookie('refreshToken', cookieOptions);

    return res
        .status(200)
        .json(new ApiResponse(200, 'User Logged Out Successfully'));
};


const getMe = async (req, res) => {

    const id = req.userId;

    const fetchedUser =
        await User.findById(id)
            .select('-password -refreshToken');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                'User Details Fetched Successfully',
                { fetchedUser }
            )
        );
};


export {
    registerUserWithPasword,
    registerUserWithGoogle,
    loginUserWithPassword,
    loggoutUser,
    getMe,
    emailVerification
};

