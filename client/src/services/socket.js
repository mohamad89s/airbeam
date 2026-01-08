import { io } from "socket.io-client";

// Use current hostname to support mobile/local network testing
const SIGNALING_SERVER_URL = import.meta.env.VITE_SIGNALING_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:3001`;

export const socket = io(SIGNALING_SERVER_URL, {
    autoConnect: false,
});

export const connectSocket = () => {
    if (!socket.connected) {
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};
