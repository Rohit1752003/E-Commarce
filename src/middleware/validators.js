import {registerWithPassword, loginSchema , forgotPasswordSchema , resetPasswordSchema} from "../validators/user.validation.js";

const validateUserWithPassword = (req , res , next)=>{
        const result = registerWithPassword.safeParse(req.body);
        if (!result.success) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: result.error.issues,
    });
  }

  next();
}
const validateLoginSchema = (req, res, next) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: result.error.issues,
    });
  }

  next();
};

const forgotPasswordValidate = (req, res, next) => {
  const result = forgotPasswordSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: result.error.issues,
    });
  }

  next();
};

const resetPasswordValidate = (req, res, next) => {
  const result = resetPasswordSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: result.error.issues,
    });
  }

  next();
};


export {validateUserWithPassword  , validateLoginSchema , resetPasswordValidate , forgotPasswordValidate}