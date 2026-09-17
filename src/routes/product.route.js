import { Router } from "express";

import {
    createProduct,
    getAllProduct,
    getOneProduct,
    updateProduct,
    deleteProduct,
    upadteProductImg, 
    removeImgOnUpdate  ,
    adminAllProduct
} from "../controllers/product.js";

import   {createProductValidation , productQueryValidation , updateProductValidation} from "../middleware/product.validate.js";

import { verifyUser } from "../middleware/auth.middleware.js";
import isAdmin from "../middleware/isAdmin.js";

import asyncHandler from "../utils/asyncHandler.js";
import { upload } from "../middleware/upload.js";

const product = Router();

// Create product — Admin only
product.post(
    "/create-product",
    verifyUser,
    upload.array('images',5),
    isAdmin,
    createProductValidation,
    asyncHandler(createProduct)
);

// Get all active products — Public
product.get(
    "/",
    productQueryValidation,
    asyncHandler(getAllProduct)
);

// Get All Product For Admin 
product.get('/admin' , verifyUser , isAdmin , asyncHandler(adminAllProduct));

// Get single product — Public
product.get(
    "/:id",
    asyncHandler(getOneProduct)
);

// Update product — Admin only
product.patch(
    "/update-product/:id",
    verifyUser,
    isAdmin,
    updateProductValidation,
    asyncHandler(updateProduct)
);

// Deactivate product — Admin only
product.delete(
    "/:id",
    verifyUser,
    isAdmin,
    asyncHandler(deleteProduct)
);

product.patch('/update-product/:id/images' , verifyUser , isAdmin , upload.array('images',5), asyncHandler(upadteProductImg))
product.delete('/update-product/:id/deleteImg' , verifyUser , isAdmin , asyncHandler(removeImgOnUpdate))
export default product;