import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import { generateResult } from './services/ai.service.js';
import cors from "cors"
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Middleware for authentication
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;

        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return next(new Error("Authentication error: Invalid token"));
        }

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error("Invalid projectId"));
        }

        const project = await projectModel.findById(projectId);
        if (!project) {
            return next(new Error("Project not found"));
        }

        socket.user = decoded;
        socket.project = project;
        socket.roomId = project._id.toString();

        next();
    } catch (error) {
        next(new Error(`Socket authentication error: ${error.message}`));
    }
});

// Handling socket connection
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.email}`);

    socket.join(socket.roomId);
    console.log(`User joined room: ${socket.roomId}`);

    socket.on("project-message", async (data) => {
        try {
            const message = data.message;
            console.log(`Received message: ${message}`);

            // Broadcast to other users in the room
            socket.broadcast.to(socket.roomId).emit("project-message", data);

            // Check if AI response is needed
            if (message.includes("@ai")) {
                const prompt = message.replace("@ai", "").trim();
                const result = await generateResult(prompt);

                io.to(socket.roomId).emit("project-message", {
                    message: result,
                    sender: {
                        _id: "ai",
                        email: "AI",
                    },
                });
            }
        } catch (error) {
            console.error("Error handling message:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.user.email}`);
        socket.leave(socket.roomId);
    });
});

(async () => {
    try {
        await connect(); // ✅ Wait until DB is connected
        server.listen(port, () => {
            console.log(`🚀 Server running at http://localhost:${port}`);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
    }
})();
