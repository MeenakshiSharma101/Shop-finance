const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const net = require("net");
require("./db");

const authRoutes = require("./routes/auth");
const salesRoutes = require("./routes/sales");
const authMiddleware = require("./middleware/auth");

const app = express();
const requestedPort = Number(process.env.PORT || 5000);

if (!process.env.JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.error("Missing JWT_SECRET. Set it in server/.env");
  process.exit(1);
}

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/sales", authMiddleware, salesRoutes);

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      const tester = net.createServer();
      tester.once("error", (err) => {
        if (err.code === "EADDRINUSE") {
          tryPort(port + 1);
        } else {
          reject(err);
        }
      });
      tester.once("listening", () => {
        tester.close(() => resolve(port));
      });
      tester.listen(port);
    };
    tryPort(startPort);
  });
}

async function startServer() {
  const resolvedPort = await findAvailablePort(requestedPort);
  if (resolvedPort !== requestedPort) {
    // eslint-disable-next-line no-console
    console.warn(
      `Port ${requestedPort} was busy, started server on port ${resolvedPort} instead.`
    );
  }

  app.listen(resolvedPort, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${resolvedPort}`);
  });
}

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", error);
  process.exit(1);
});
