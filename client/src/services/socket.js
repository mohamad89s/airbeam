import { io } from "socket.io-client";

// Use current hostname to support mobile/local network testing
const SIGNALING_SERVER_URL = import.meta.env.VITE_SIGNALING_SERVER_URL ||
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? `http://${window.location.hostname}:3001`
        : `http://${window.location.hostname}:3001`);

export const socket = io(SIGNALING_SERVER_URL, {
    autoConnect: false,
    transports: ["polling", "websocket"], // Polling first to bypass VPN/Firewall blocking
    reconnectionAttemps: 5,
    timeout: 10000
});

export const connectSocket = () => {
    if (!socket.connected) {
        console.log("🚀 Attempting to connect to:", SIGNALING_SERVER_URL);
        console.log("Transport type: polling (preferred for VPN compatibility)");
        socket.connect();
    }
};

socket.on("connect", () => {
    console.log("✅ Connected to signaling server with ID:", socket.id);
    console.log("Actual transport used:", socket.io.engine.transport.name);
});

socket.on("connect_error", (error) => {
    console.error("❌ Connection error:", error.message);
    console.error("Connection details:", {
        url: SIGNALING_SERVER_URL,
        transport: socket.io.engine.transport ? socket.io.engine.transport.name : 'none'
    });
    if (error.message === "xhr poll error") {
        console.error("This usually means CORS is blocking the connection or the server is down.");
    }
});

socket.on("reconnect_attempt", (attempt) => {
    console.log(`🔄 Reconnection attempt #${attempt}`);
});

socket.on("disconnect", (reason) => {
    console.warn("Disconnected:", reason);
});

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};
