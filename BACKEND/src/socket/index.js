import { Server } from "socket.io"

// Attach Socket.IO to the server
const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*", // or set to your frontend URL
        },
    });

    return io
}

export default connectToSocket