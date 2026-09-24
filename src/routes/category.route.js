import { Router } from "express";

import {
    createCategory,
    getAllCategory,
    getOneCategory,
    updateCategory,
    deactivateCategory
} from "../controllers/category.js";

import {
    createCategoryValidation,
    categoryQueryValidation,
    updateCategoryValidation
} from "../middleware/category.validation.js";

import { verifyUser } from "../middleware/auth.middleware.js";
import {isAdmin} from "../middleware/isAdmin.js";

import asyncHandler from "../utils/asyncHandler.js";

const category = Router();
category.post('/create' , verifyUser , isAdmin , createCategoryValidation ,  asyncHandler(createCategory))

category.get('/' ,categoryQueryValidation ,  asyncHandler(getAllCategory));
category.get('/:id' , asyncHandler(getOneCategory));
category.patch('/update/:id' , verifyUser , isAdmin , updateCategoryValidation , asyncHandler(updateCategory));
category.delete('/deactivet-category/:id' , verifyUser , isAdmin , asyncHandler(deactivateCategory));
export default category