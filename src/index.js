import dotenv from 'dotenv';
import app from './app.js'; 
import connectDb from './config/db.js'
import http from 'http'
import { Server } from 'socket.io';

dotenv.config({
    "path": ".env"
});
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

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

