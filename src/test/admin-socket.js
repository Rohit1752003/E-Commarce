

import { io } from "socket.io-client";

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTlmZTY0MWVlODkyZWJlNmE0ZTQxOTQiLCJpYXQiOjE3OTAyNDE4OTgsImV4cCI6MTc5MDMyODI5OH0.o7RgI3bRaONs0yFjmqJHanK7J76LKkAmpM_jZuwelUU"

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