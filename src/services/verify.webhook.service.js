 import crypto from "crypto";
import AppError from "../utils/apiError.js";
 const verifySignature = async(req)=>{
    const signature =
        req.headers["x-razorpay-signature"];

    if (!signature) {
        throw new AppError(
        400,
        "Razorpay webhook signature missing"
        );
    }

    const data = req.body;

    const generateSignature = crypto
        .createHmac(
        "sha256",
        process.env.RAZORPAY_WEBHOOK_SECRET
        )
        .update(data)
        .digest("hex");

    if (generateSignature !== signature) {
        throw new AppError(
        400,
        "Payment Verification failed"
        );
    }
 }
 export default verifySignature
 