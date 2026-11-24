
import crypto from "crypto";
import AppError from "../utils/apiError.js";

const verifySignature = (req) => {
  const signature = req.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const rawBody = req.body;

  // Validate webhook configuration
  if (!secret) {
    throw new AppError(500, "Webhook secret is not configured");
  }

  // Validate signature header
  if (
    typeof signature !== "string" ||
    !/^[a-fA-F0-9]{64}$/.test(signature)
  ) {
    throw new AppError(400, "Invalid Razorpay webhook signature");
  }

  // Ensure original raw request body is available
  if (!Buffer.isBuffer(rawBody)) {
    throw new AppError(400, "Invalid webhook request body");
  }

  // Generate expected HMAC signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest();

  // Convert received hexadecimal signature into bytes
  const receivedSignature = Buffer.from(signature, "hex");

  // Constant-time comparison
  if (
    !crypto.timingSafeEqual(
      expectedSignature,
      receivedSignature
    )
  ) {
    throw new AppError(400, "Razorpay webhook verification failed");
  }

  return true;
};

export default verifySignature;
