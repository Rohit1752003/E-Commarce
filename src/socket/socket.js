import AppError from "../utils/apiError.js";

let io;

export const initSocket  = (socketIO)=>{
    io = socketIO
}
export const getIO = ()=>{
    if(!io)throw new AppError(500,"Socket.IO has not been initialized")
        return io;
}