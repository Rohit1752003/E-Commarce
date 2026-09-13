import User from "../models/user.model.js";    
import AppError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponce.js";

const isAdmin = async(req, res , next) =>{
    const id  = req.userId;
        const user = await User.findById(id);
        if (!user) {
    throw new AppError(401, "User does not exist");
}
        if (user.role !== 'admin') {
        
            throw new AppError(403, 'Forbidden Access');
  }
  next();
}
export default isAdmin
