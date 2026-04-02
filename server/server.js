const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
dotenv.config();
const { connectDB } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const userRoutes = require("./routes/userRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const quizRoutes = require("./routes/quizRoutes");
const streamRoutes = require("./routes/classStreamRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { errorHandler } = require("./middleware/errorHandler");
const { serviceWindowMiddleware } = require("./middleware/serviceCheck");
const seedDatabase = require("./utils/seedDatabase");
const discussionRoutes = require("./routes/discussionRoutes");
const searchroomRoutes = require("./routes/searchroomRoutes");

// ... imports
const fs = require("fs");
const https = require("https");
const os = require("os");

const app = express();

console.log(
  "Configuring Security Headers with updated CSP for Google Fonts...",
);

// Middleware
// TIGHTENING: CORS Configuration
// when testing from another device we need to allow the LAN address
// or any origin; during production you should lock this down to the
// specific client URL.
const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      origin === process.env.CLIENT_URL ||
      origin.startsWith("http://192.168.") ||
      origin.startsWith("http://127.0.0.1") ||
      origin.startsWith("http://localhost")
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger for debugging LAN access
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}`,
  );
  next();
});

// Removed manual CSP middleware as Helmet handles it now

// Serve static files
app.use(
  express.static(path.join(__dirname, "../client/public"), {
    setHeaders: (res, filepath) => {
      if (filepath.endsWith("service-worker.js")) {
        res.setHeader(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        );
        res.setHeader("Service-Worker-Allowed", "/");
      }
      if (filepath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  }),
);
app.use("/pages", express.static(path.join(__dirname, "../client/public/pages")));

// Uploads path: prefer APP-defined path, else project folder.
// If that is not writable, fall back to per-user local path, then temp path.
let uploadsPath = path.resolve(
  process.env.UPLOADS_PATH || path.join(__dirname, "../uploads"),
);
const fallbackUploadsPath = path.resolve(
  os.homedir(),
  "AppData",
  "Local",
  "Nsoma-DigLibs",
  "uploads",
);
const tempUploadsPath = path.resolve(os.tmpdir(), "Nsoma-DigLibs", "uploads");

function ensureUploadsDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created uploads static directory: ${dir}`);
  }
  return dir;
}

try {
  uploadsPath = ensureUploadsDirectory(uploadsPath);
} catch (err) {
  console.warn(
    `Unable to use uploads directory ${uploadsPath}: ${err.message}. Falling back to ${fallbackUploadsPath}`,
  );
  try {
    uploadsPath = ensureUploadsDirectory(fallbackUploadsPath);
  } catch (fallbackError) {
    console.warn(
      `Unable to use fallback uploads directory ${fallbackUploadsPath}: ${fallbackError.message}. Falling back to ${tempUploadsPath}`,
    );
    try {
      uploadsPath = ensureUploadsDirectory(tempUploadsPath);
    } catch (finalError) {
      console.error(
        `Unable to create temp uploads directory ${tempUploadsPath}:`,
        finalError,
      );
      throw finalError;
    }
  }
}

app.use("/uploads", express.static(uploadsPath));

// Health check endpoint (no auth required) - for service verification
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Server is working perfectly!",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api", serviceWindowMiddleware);
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/streams", streamRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/searchroom", searchroomRoutes);

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/public/index.html"));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = Number(process.env.PORT) || 5000;
const MAX_PORT = PORT + 20;

const startListening = (serverCreator, port) =>
  new Promise((resolve, reject) => {
    const server = serverCreator(port, "0.0.0.0", () =>
      resolve({ server, port }),
    );
    server.on("error", reject);
  });

const findAvailablePort = async () => {
  for (let currentPort = PORT; currentPort <= MAX_PORT; currentPort++) {
    try {
      const result = await startListening(app.listen.bind(app), currentPort);
      return result;
    } catch (err) {
      if (err.code !== "EADDRINUSE") {
        throw err;
      }
      console.warn(`Port ${currentPort} is in use, trying next port...`);
    }
  }
  throw new Error(`No available ports between ${PORT} and ${MAX_PORT}`);
};

const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();

    const os = require("os");
    const addresses = [];
    Object.values(os.networkInterfaces()).forEach((nets) => {
      nets.forEach((net) => {
        if (net.family === "IPv4" && !net.internal) {
          addresses.push(net.address);
        }
      });
    });

    // Optional HTTPS configuration
    const sslKeyPath = process.env.SSL_KEY_PATH;
    const sslCertPath = process.env.SSL_CERT_PATH;
    const sslPort = process.env.SSL_PORT || 5443;
    const redirectHttp = process.env.REDIRECT_HTTP_TO_HTTPS === "true";

    const logStartup = (proto, port) => {
      console.log("");
      console.log("================================================");
      console.log(`Server running on:`);
      console.log(`- Local:   ${proto}://localhost:${port}`);
      addresses.forEach((addr) => {
        console.log(`- Network: ${proto}://${addr}:${port}`);
      });
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("Database: Connected");
      console.log("================================================");
      console.log("");
    };

    if (
      sslKeyPath &&
      sslCertPath &&
      fs.existsSync(sslKeyPath) &&
      fs.existsSync(sslCertPath)
    ) {
      // Start HTTPS server
      const key = fs.readFileSync(sslKeyPath);
      const cert = fs.readFileSync(sslCertPath);
      const httpsServer = https.createServer({ key, cert }, app);

      try {
        await startListening(httpsServer.listen.bind(httpsServer), sslPort);
        logStartup("https", sslPort);
      } catch (err) {
        if (err.code === "EADDRINUSE") {
          console.warn(
            `HTTPS port ${sslPort} is in use; aborting HTTPS startup`,
          );
        } else {
          throw err;
        }
      }

      if (redirectHttp) {
        // start an HTTP listener that redirects to HTTPS
        const http = require("http");
        const redirectServer = http.createServer((req, res) => {
          const host = req.headers.host
            ? req.headers.host.split(":")[0]
            : "localhost";
          const target = `https://${host}:${sslPort}${req.url}`;
          res.writeHead(301, { Location: target });
          res.end();
        });
        try {
          await startListening(
            redirectServer.listen.bind(redirectServer),
            PORT,
          );
          console.log(`HTTP -> HTTPS redirect active on port ${PORT}`);
        } catch (err) {
          if (err.code === "EADDRINUSE") {
            console.warn(
              `HTTP redirect port ${PORT} is in use; skipping redirect server`,
            );
          } else {
            throw err;
          }
        }
      } else {
        // keep a normal HTTP server as well (non-redirecting)
        const { port: httpPortUsed } = await findAvailablePort();
        logStartup("http", httpPortUsed);
      }
    } else {
      // No valid SSL config: start plain HTTP only
      const { port: httpPortUsed } = await findAvailablePort();
      logStartup("http", httpPortUsed);

      if (
        (sslKeyPath || sslCertPath) &&
        !(fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath))
      ) {
        console.warn(
          "SSL paths provided but files not found. Falling back to HTTP.",
        );
      }
    }
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err.message);
  process.exit(1);
});
