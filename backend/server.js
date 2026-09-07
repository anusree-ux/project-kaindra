const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const env = require("./src/config/environment");
const {
  initLocationSocketService,
} = require("./src/services/mototribe/locationSocketService");

const PORT = env.port;

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.io server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Initialize MotoTribe Live Location Socket Service
initLocationSocketService(io);

server.listen(PORT, () => {
  console.log(
    `Server running in ${env.nodeEnv} mode with Socket.io on http://localhost:${PORT}`
  );
});