import orderExpiration from "../controllers/expireOrder.js";
import {Router} from "express";
import asyncHandler from "../utils/asyncHandler.js";
const expire = Router();
expire.post('/:orderId' , asyncHandler(orderExpiration));

export default expire;