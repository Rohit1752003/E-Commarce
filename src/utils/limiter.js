import rateLimit from "express-rate-limit";


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // limit each IP to 5 requests per windowMs   
    message: {
        success: false,
        message: "Too many login attempts, please try again later."
    }
});
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: "Too many registration attempts, please try again later."
    }
}); 
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // limit each IP to 50 requests per windowMs
    message: {
        success: false,
        message: "Too many requests, please try again later."
    }
});
export {  loginLimiter, registerLimiter , authLimiter };