import {createProductSchema , updateProductSchema , productQuerySchema} from '../validators/product.validators.js'


const createProductValidation = (req, res, next)=>{
    const result = createProductSchema.safeParse(req.body);
    if (!result.success) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: result.error.issues,
    });
  }

  next();
}
const productQueryValidation = (req, res, next)=>{
    const result = productQuerySchema.safeParse(req.query);
    if (!result.success) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: result.error.issues,
    });
  }
  req.validatedQuery  = result.data;
  next();
}
const updateProductValidation = (req , res , next)=>{
     const result = updateProductSchema.safeParse(req.body);
    if (!result.success) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: result.error.issues,
    });
  }

  next();
}
export {createProductValidation , productQueryValidation , updateProductValidation}