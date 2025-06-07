import { io } from "socket.io-client";

let socketInstance = null; // Global variable to store socket instance

export const initializeSocket = (projectId) => {
    if (!socketInstance) {
        socketInstance = io("http://localhost:3000", {
            auth: { token: localStorage.getItem("token") },
            query: { projectId },
            reconnectionAttempts: 5, // Try reconnecting 5 times if connection is lost
            reconnectionDelay: 3000, // Wait 3 seconds before trying again
            transports: ['websocket', 'polling']
        });

        socketInstance.on("connect", () => {
            console.log("Connected to WebSocket server");
        });

        socketInstance.on("disconnect", (reason) => {
            console.warn("Socket disconnected:", reason);
        });

        socketInstance.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
        });
    }
    return socketInstance;
};

export const receiveMessage = (eventName, cb) => {
    if (!socketInstance) {
        console.error("Socket instance is not initialized!");
        return;
    }
    socketInstance.on(eventName, cb);
};

export const sendMessage = (eventName, data) => {
    if (!socketInstance) {
        console.error("Socket instance is not initialized!");
        return;
    }
    socketInstance.emit(eventName, data);
};

export const disconnectSocket = () => {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
};
