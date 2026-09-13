import {generateToken} from "../utils/jwt.js";
import User from '../models/user.model.js'
import ApiResponse from "../utils/apiResponce.js";
import AppError from "../utils/apiError.js";
const refreshAccessToken = async (req, res) => {
  const id = req.userId;

  const refreshToken = req.cookies.refreshToken;
  const user = await User.findById(id);

  if (!user) {
    throw new AppError(404, 'User does not exist');
  }

  if (refreshToken !== user.refreshToken) {
    throw new AppError(401, 'Invalid refresh token');
  }

  const accessToken = generateToken(user._id);

  res
    .status(200)
    .json(new ApiResponse(200, 'Access Token generated', { accessToken : accessToken }));
};
export default refreshAccessToken