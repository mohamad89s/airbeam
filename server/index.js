const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require('cors');

app.use(cors());

console.log('CORS Origin allowed:', process.env.CORS_ORIGIN || "*");

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 3000,
  pingInterval: 2000,
  transports: ["websocket", "polling"]
});

// --- SECURITY: Basic Manual Rate Limiting ---
const connectionRates = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_CONNECTIONS_PER_WINDOW = 30; // Max 30 connections per min per IP

io.use((socket, next) => {
  const ip = socket.handshake.address;
  const now = Date.now();
  const userRecord = connectionRates.get(ip) || { count: 0, firstVisit: now };

  if (now - userRecord.firstVisit > RATE_LIMIT_WINDOW) {
    userRecord.count = 1;
    userRecord.firstVisit = now;
  } else {
    userRecord.count++;
  }

  connectionRates.set(ip, userRecord);

  if (userRecord.count > MAX_CONNECTIONS_PER_WINDOW) {
    console.log(`⚠️ Blocked IP ${ip} due to rate limiting.`);
    return next(new Error('Too many connection attempts. Please try again later.'));
  }
  next();
});

// --- SECURITY: HTTP Headers ---
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

io.on('connection', (socket) => {
  const transport = socket.conn.transport.name;
  console.log(`✅ A user connected: ${socket.id} (Transport: ${transport})`);

  socket.conn.on('upgrade', (transport) => {
    console.log(`🚀 Transport upgraded for ${socket.id} to: ${transport.name}`);
  });

  socket.on('join-room', (payload) => {
    // Support both string (legacy) and object payload
    let roomId = typeof payload === 'string' ? payload : payload.roomId;
    const role = typeof payload === 'string' ? 'unknown' : payload.role;

    // Convert number to string if necessary
    if (typeof roomId === 'number') roomId = roomId.toString();

    // SECURITY: Input Validation
    if (!roomId || typeof roomId !== 'string' || !/^\d{6}$/.test(roomId)) {
      console.warn(`Refused join for invalid Room ID: ${roomId} (Type: ${typeof roomId}) from ${socket.id}`);
      socket.emit('error', 'Invalid Room ID format');
      return;
    }

    const clients = io.sockets.adapter.rooms.get(roomId);
    const numClients = clients ? clients.size : 0;

    // Logic: Allow receivers to join empty rooms so they can wait for a sender (helpful for iOS backgrounding).
    if (role === 'receiver' && numClients === 0) {
      console.log(`ℹ️ Receiver ${socket.id} waiting for Sender in empty room ${roomId}`);
    }

    // SECURITY: Room Locking - increased to 3 to allow brief overlap during mobile reconnects
    if (numClients >= 3) {
      console.warn(`Room ${roomId} is full. User ${socket.id} rejected.`);
      socket.emit('error', 'Room is full');
      return;
    }

    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId} as ${role}`);

    // Notify others in the room
    socket.to(roomId).emit('user-joined', socket.id);

    // Also notify the person who JUST joined about who is already there
    if (clients && clients.size > 0) {
      const existingPeers = Array.from(clients).filter(id => id !== socket.id);
      if (existingPeers.length > 0) {
        socket.emit('existing-peers', existingPeers);
      }
    }
  });

  socket.on('leave-room', (roomId) => {
    if (roomId) {
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', socket.id);
      console.log(`User ${socket.id} left room ${roomId}`);
    }
  });

  socket.on('offer', (payload) => {
    if (!payload || !payload.target || !payload.sdp) return; // Basic validation
    console.log(`Relaying offer from ${socket.id} to ${payload.target}`);
    io.to(payload.target).emit('offer', {
      sdp: payload.sdp,
      caller: socket.id
    });
  });

  socket.on('answer', (payload) => {
    if (!payload || !payload.target || !payload.sdp) return; // Basic validation
    console.log(`Relaying answer from ${socket.id} to ${payload.target}`);
    io.to(payload.target).emit('answer', {
      sdp: payload.sdp,
      responder: socket.id
    });
  });

  socket.on('ice-candidate', (payload) => {
    if (!payload || !payload.target || !payload.candidate) return; // Basic validation
    io.to(payload.target).emit('ice-candidate', {
      candidate: payload.candidate,
      sender: socket.id
    });
  });

  socket.on('disconnecting', () => {
    console.log('User disconnecting:', socket.id);
    // Notify others in all rooms this user was in
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit('user-left', socket.id);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
