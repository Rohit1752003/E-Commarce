import jwt from 'jsonwebtoken'
import AppError from '../utils/apiError.js';

const verifyUser = async (req, res, next) => {
  const header = req.header('Authorization');

  if (!header) {
    throw new AppError(401, 'Authorization header does not exist');
  }

  const token = header.split(' ')[1];

  if (!token) {
    throw new AppError(401, 'Token does not exist');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.userId = decoded.userId;

  next();
};

const verifyRefreshToken = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    throw new AppError(401, 'Refresh token does not exist');
  }

  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  req.userId = decoded.userId;

  next();
};

export { verifyUser, verifyRefreshToken };
