import dotenv from 'dotenv';
import app from './app.js'; 
import connectDb from './config/db.js'
dotenv.config({
    "path": ".env"
});
const PORT = process.env.PORT || 4000
const connectServer = async()=>{
    try{
       await connectDb();
        console.log("PORT:", PORT);
        console.log("APP LOADED");
       app.listen( PORT ,()=>{
        console.log(`Server is running on : ${PORT}`)
       

       })

    }catch(err){
        console.log("failed to start Server");
        console.log(err);
    }
}
connectServer();

