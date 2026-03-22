import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 3001;

// 1️⃣ Plain HTTP server (NO Next.js here)
const httpServer = createServer();

// 2️⃣ Attach Socket.IO to raw server
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // Next.js app
    methods: ["GET", "POST"],
  },
});


io.on("connection", (socket) => {
  console.log(`user connected ${socket.id}`)

  socket.on('join-room', ({ roomId }) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.onAny((event, payload) => {
    console.log(`📩 Server received event: ${event}`, payload);
  });

  socket.on('toggle-editor', ({ isOpen }) => {
    console.log("🟩 Server received toggle-editor:", isOpen);
    io.emit('toggle-editor', { isOpen });
  });

  socket.on('code-change', ({ code, roomId }) => {
    console.log('code-change');
    socket.to(roomId).emit('code-change', { code });
  });

  socket.on('code-result', ({ output, stderr, roomId }) => {
    socket.broadcast.to(roomId).emit('code-result', { output, stderr });
  });

  socket.on('language-change', (data) => {
    console.log(`🟩 Server received language-change:`, data);
    const { language, roomId } = data;
    socket.to(roomId).emit('language-change', { language });
  });

  socket.on('tab-switched', ({ roomId, userName }) => {
    console.log(`User ${userName} switched tabs in room ${roomId}`);
    // Broadcast to everyone in the room; the client-side logic will ensure only the host acts on it
    socket.to(roomId).emit('notify-host-tab-switch', { userName });
  });

  socket.on('proctoring-control', ({ roomId, isActive }) => {
  console.log(`Proctoring ${isActive ? 'started' : 'stopped'} in room ${roomId}`);
  // Use io.to(roomId) to ensure it reaches EVERYONE in the room, including the sender if needed
  // or socket.to(roomId) to reach everyone EXCEPT the sender.
  io.to(roomId).emit('proctoring-update', { isActive });
});



  socket.on("disconnect", () => {
    console.log(`User disconnected ${socket.id}`)
  })
});




httpServer.listen(PORT, () => {
  console.log(`server is running on port http://localhost:${PORT}`)
});