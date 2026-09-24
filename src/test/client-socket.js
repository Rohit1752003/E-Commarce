import { io } from "socket.io-client";

console.log("Starting socket client...");

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTlmZGZlOWYzNzU0NGYyNDRmMTg2ZTYiLCJpYXQiOjE3OTAyNDI4ODYsImV4cCI6MTc5MDMyOTI4Nn0.VbiXhTXXuAsY0mUJhendfkbC1N4MrhyiDcFTkXirEnk"

const socket = io("http://localhost:5000", {
    auth: {
        token
    }
});

console.log("Socket object created");

socket.on("connect", () => {
    console.log("CONNECTED:", socket.id);

});


socket.on("notification", (data)=>{
    console.log(data)
})

socket.on("disconnect", (reason) => {
    console.log("DISCONNECTED:", reason);
});