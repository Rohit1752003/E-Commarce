import jwt from 'jsonwebtoken';
const socketAuth = async(socket , next)=>{
  try{
    const token = socket.handshake.auth.token;
    if(!token)throw new AppError(400 , "Authentication Required");

    const decode = jwt.verify(token , process.env.JWT_SECRET);
    socket.userId = decode.userId
    next();
  }catch(err){
     next(err);
  }
}
export {socketAuth}