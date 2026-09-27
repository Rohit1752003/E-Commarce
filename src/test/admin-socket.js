

import { io } from "socket.io-client";

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTlmZGZlOWYzNzU0NGYyNDRmMTg2ZTYiLCJpYXQiOjE3OTAyNTE4MDQsImV4cCI6MTc5MDMzODIwNH0.54n9zStXAXJ7sbO7tNhHtCvik_EXOKkAyUgYvt4Rqlk"

const socket = io("http://localhost:5000", {
    auth: {
        token
    }
});

socket.on("connect", () => {

    console.log("Admin connected:", socket.id);


});

socket.on("admin", (data)=>{
    console.log(data)
})
socket.on("disconnect", () => {
    console.log("Disconnected");
});