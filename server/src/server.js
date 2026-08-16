import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocketServer } from './sockets/socketServer.js';

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);
  initSocketServer(server);

  const PORT = env.PORT;
  server.listen(PORT, () => {
    console.log(`\x1b[32m[Server] Running in ${env.NODE_ENV} mode on port ${PORT}\x1b[0m`);
  });
};

startServer();
