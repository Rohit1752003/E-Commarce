import { Router } from "express";   
import { verifyUser } from "../middleware/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import {cartValidation} from "../middleware/cart.validation.js";
import {addToCart , getAllItemInCart , updateProductQuantity , removeFromCart  , clearCart} from "../controllers/cart.js";

const cart  = Router();

cart.post('/items' , verifyUser , cartValidation , asyncHandler(addToCart))
cart.get('/' , verifyUser , asyncHandler(getAllItemInCart));
cart.patch('/items/:id' ,verifyUser , asyncHandler(updateProductQuantity))
cart.delete('/items/:id' , verifyUser , asyncHandler(removeFromCart))
cart.delete('/' , verifyUser , asyncHandler(clearCart))
export default cart;