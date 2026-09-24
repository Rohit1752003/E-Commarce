import dotenv from 'dotenv';
import app from './app.js'; 
import connectDb from './config/db.js'
import http from 'http'
import { Server } from 'socket.io';
import {socketAuth} from './socket/socketAuth.js'
import { initSocket } from './socket/socket.js';
import User from './models/user.model.js';
dotenv.config({
    "path": ".env"
});
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:"http://localhost:5173",
  },
});
initSocket(io);
io.use(socketAuth);


io.on("connection", async (socket) => {

    console.log("Socket connected:", socket.id);

    const userId = socket.userId;

    socket.join(`user:${userId}`);

    console.log(
        `${socket.id} joined user:${userId}`
    );

    const user = await User.findById(userId);

    if (!user) {
        socket.disconnect();
        return;
    }

    if (user.role === "admin") {

        socket.join("admins");

        console.log(
            `${socket.id} joined admins`
        );
    }

    console.log(
        "Rooms:",
        [...socket.rooms]
    );


    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });

});
const PORT = process.env.PORT || 4000
const connectServer = async()=>{
    try{
       await connectDb();
        console.log("PORT:", PORT);
        console.log("APP LOADED");
       server.listen( PORT ,()=>{
        console.log(`Server is running on : ${PORT}`)
       

       })

    }catch(err){
        console.log("failed to start Server");
        console.log(err);
    }
}
connectServer();

