import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import { createServer } from "node:http";
import connectToDB from "./src/DB/db.js";
import connectToSocket from "./src/socket/index.js";

app.set("port", process.env.PORT || 8000);

// Create HTTP server using Express app
const server = createServer(app);
// Attach Socket.IO to the server
const io = connectToSocket(server);

// Example: enable when you’re ready to use Socket.IO
// io.on("connection", (socket) => {
//   console.log("A user connected:", socket.id);

//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });

const start = async () => {
  try {
    await connectToDB();
    server.listen(app.get("port"), () => {
      console.log(`LISTENING ON PORT ${app.get("port")} 🙂`);
    });
  } catch (err) {
    console.error("Server failed to start:", err);
    process.exit(1);
  }
};

start();
