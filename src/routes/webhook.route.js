import { webHook } from "../controllers/webhook.js";

import asyncHandler from "../utils/asyncHandler.js";

import { Router } from "express";
const webhook = Router();

webhook.post('/razorpay' , asyncHandler(webHook))

export default webhook;