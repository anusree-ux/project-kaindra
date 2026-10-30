const dns = require("dns");

// Fix Node.js SRV DNS resolution for MongoDB Atlas
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const env = require("./src/config/environment");
const {
  initLocationSocketService,
} = require("./src/services/mototribe/locationSocketService");
const { initScheduler } = require("./src/scripts/scheduler");
const connectDB = require("./src/config/database");

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

const startServer = async () => {
  env.validateProductionEnvironment();
  await connectDB();

  initLocationSocketService(io);
  initScheduler();

  server.listen(PORT, () => {
    console.log(
      `Server running in ${env.nodeEnv} mode with Socket.io on port ${PORT}`
    );
  });
};

startServer().catch((error) => {
  console.error("Backend startup failed:", error.message);
  process.exit(1);
});