import AppError from "../utils/apiError.js";
import cartSchema from "../validators/cart.validators.js";
const cartValidation = (req , res , next)=>{
    const result = cartSchema.safeParse(req.body)
    if(!result.success){
        throw new AppError(400 , "Validation Error")
    }

    next();
}
export default cartValidation