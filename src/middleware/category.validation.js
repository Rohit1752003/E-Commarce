import {createCategorySchema , categoryQuery , updateCategorySchmea} from '../validators/category.validators.js'

const createCategoryValidation = (req, res, next)=>{
    const result = createCategorySchema.safeParse(req.body);
    if (!result.success) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: result.error.issues,
    });
  }

  next();
}
const categoryQueryValidation = (req, res, next)=>{
    const result = categoryQuery.safeParse(req.query);
    if (!result.success) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: result.error.issues,
    });
  }
  req.validatedQuery  = result.data;
  next();
}
const updateCategoryValidation = (req , res , next)=>{
     const result = updateCategorySchmea.safeParse(req.body);
    if (!result.success) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: result.error.issues,
    });
  }

  next();
}
export {createCategoryValidation , categoryQueryValidation , updateCategoryValidation}