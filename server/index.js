const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require('cors');

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for now (dev mode)
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    // Notify others in the room
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('offer', (payload) => {
    // payload: { target: socketId, sdp: ... }
    io.to(payload.target).emit('offer', {
      sdp: payload.sdp,
      caller: socket.id
    });
  });

  socket.on('answer', (payload) => {
    // payload: { target: socketId, sdp: ... }
    io.to(payload.target).emit('answer', {
      sdp: payload.sdp,
      responder: socket.id
    });
  });

  socket.on('ice-candidate', (payload) => {
    // payload: { target: socketId, candidate: ... }
    io.to(payload.target).emit('ice-candidate', {
        candidate: payload.candidate,
        sender: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
