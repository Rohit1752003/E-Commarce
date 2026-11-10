import { createPayment , verifyPayment } from "../controllers/payment.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyUser } from "../middleware/auth.middleware.js";

import { Router } from "express";
const payment = Router();
payment.post('/verify', verifyUser, asyncHandler(verifyPayment));
payment.post('/:orderId', verifyUser, asyncHandler(createPayment));
export default payment