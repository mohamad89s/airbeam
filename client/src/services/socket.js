import { io } from "socket.io-client";

// Use current hostname to support mobile/local network testing
const SIGNALING_SERVER_URL = import.meta.env.VITE_SIGNALING_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:3001`;

export const socket = io(SIGNALING_SERVER_URL, {
    autoConnect: false,
});

export const connectSocket = () => {
    if (!socket.connected) {
        console.log("Attempting to connect to:", SIGNALING_SERVER_URL);
        socket.connect();
    }
};

socket.on("connect", () => {
    console.log("Connected to signaling server:", socket.id);
});

socket.on("connect_error", (error) => {
    console.error("Connection error:", error.message);
    if (error.message === "xhr poll error") {
        console.error("This usually means CORS is blocking the connection or the server is down.");
    }
});

socket.on("disconnect", (reason) => {
    console.warn("Disconnected:", reason);
});

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};
