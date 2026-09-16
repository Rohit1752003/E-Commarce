import AppError from "../utils/apiError.js";
import cartSchema from "../validators/cart.validators.js";
import {addressSchema, orderQuerySchema} from "../validators/order.validators.js";
const cartValidation = (req , res , next)=>{
    const result = cartSchema.safeParse(req.body)
    if(!result.success){
        throw new AppError(400 , "Validation Error")
    }

    next();
}
const orderAddressValidation = (req, res , next)=>{
  const result = addressSchema.safeParse(req.body.shippingAddress);
    if(!result.success){
        throw new AppError(400 , "Validation Error")
    }

    next();
}
const queryValidation = (req , res , next)=>{
    const result = orderQuerySchema.safeParse(req.body)
    if(!result.success){
        throw new AppError(400 , "Validation Error")
    }

    next();
}
export  {cartValidation , orderAddressValidation , queryValidation}