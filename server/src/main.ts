import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Adjust for production
  },
});

app.get('/', (req, res) => {
  res.send('Hello, TypeScript + Express + Socket.IO!');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('message', (msg: string) => {
    console.log('Message received:', msg);
    io.emit('message', `Server received: ${msg}`);
  });
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
