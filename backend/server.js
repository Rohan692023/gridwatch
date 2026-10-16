require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");
const { initSockets } = require("./sockets");

const authRoutes = require("./routes/authRoutes");
const zoneRoutes = require("./routes/zoneRoutes");
const dispatchRoutes = require("./routes/dispatchRoutes");
const auditRoutes = require("./routes/auditRoutes");

const app = express();
const server = http.createServer(app);

const requiredProductionEnv = [
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "CLIENT_ORIGIN",
];
if (process.env.NODE_ENV === "production") {
  const missing = requiredProductionEnv.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing production environment variables: ${missing.join(", ")}`);
  }
  if (process.env.JWT_SECRET.length < 32 || process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error("JWT secrets must each contain at least 32 characters in production");
  }
}

const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const isAllowedOrigin = (origin, callback) => {
  if (!origin || clientOrigins.includes(origin)) {
    return callback(null, true);
  }
  return callback(new Error("Origin is not allowed by CORS"));
};

const io = new Server(server, {
  cors: { origin: isAllowedOrigin, credentials: true },
});

// --- Security middleware ---
app.use(helmet());
app.use(cors({ origin: isAllowedOrigin, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(mongoSanitize()); // strips $ and . operators from user input (NoSQL injection)
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/api", apiLimiter);

app.set("io", io);

// --- Routes ---
app.get("/", (req, res) => {
  res.json({ name: "GridWatch API", status: "ok", health: "/api/health" });
});
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
app.use("/api/auth", authRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/audit", auditRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  initSockets(io);
  server.listen(PORT, () => {
    console.log(`GridWatch API listening on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  });
}

start();

// Fail loudly instead of hanging silently on unexpected errors
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});
