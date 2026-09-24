import { Router } from "express";
import { getAllOrdersByAdmin   , updateStatus , getOneOrderByAdmin} from "../controllers/admin.js";  
import { verifyUser } from "../middleware/auth.middleware.js";
import {isAdmin} from "../middleware/isAdmin.js";
import asyncHandler from "../utils/asyncHandler.js";
import { queryValidation  , allowedNextStatusValidation} from "../middleware/cart.validation.js";
const admin = Router()

admin.get('/' , verifyUser  , isAdmin ,queryValidation , asyncHandler(getAllOrdersByAdmin))
admin.get('/:id' , verifyUser , isAdmin , asyncHandler(getOneOrderByAdmin))
admin.patch('/:id/status' , verifyUser , isAdmin , allowedNextStatusValidation , asyncHandler(updateStatus))
export default admin