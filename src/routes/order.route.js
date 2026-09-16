import { verifyUser } from "../middleware/auth.middleware.js";
import { orderAddressValidation, queryValidation } from "../middleware/cart.validation.js";

import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {checkOut  , getAllOrders , getOneOrder , canceledOrder}  from "../controllers/checkOut.js";

const order = Router()

order.post('/', verifyUser , orderAddressValidation , asyncHandler(checkOut));
order.get('/' , verifyUser ,queryValidation, asyncHandler(getAllOrders))
order.get('/:id' , verifyUser , asyncHandler(getOneOrder));
order.patch('/:id' , verifyUser  , asyncHandler(canceledOrder));
export default order;