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

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// ... imports
const fs = require("fs");
const https = require("https");

const app = express();

console.log(
  "Configuring Security Headers with updated CSP for Google Fonts...",
);
// TIGHTENING: Security Headers with customized CSP
const isProd = process.env.NODE_ENV === "production";
const defaultConnectSrc = isProd
  ? [
      "'self'",
      "http://localhost:5000",
      "http://127.0.0.1:5000",
      "https://localhost:5443",
      "https://127.0.0.1:5443",
      "http://192.168.*:*",
      "https://192.168.*:*",
      "https://cdn.jsdelivr.net",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
    ]
  : ["'self'", "http:", "https:", "data:", "blob:"];

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
        ],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: defaultConnectSrc,
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://fonts.googleapis.com",
        ],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Rate limiting - increased for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (increased for dev)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

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
app.use("/pages", express.static(path.join(__dirname, "../client/pages")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Server is working perfectly!",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/streams", streamRoutes);
app.use("/api/dashboard", dashboardRoutes);

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
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();

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
      httpsServer.listen(sslPort, "0.0.0.0", () =>
        logStartup("https", sslPort),
      );

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
        redirectServer.listen(PORT, "0.0.0.0", () => {
          console.log(`HTTP -> HTTPS redirect active on port ${PORT}`);
        });
      } else {
        // keep a normal HTTP server as well (non-redirecting)
        app.listen(PORT, "0.0.0.0", () => {
          console.log(`HTTP server also listening on port ${PORT}`);
        });
      }
    } else {
      // No valid SSL config: start plain HTTP only
      app.listen(PORT, "0.0.0.0", () => logStartup("http", PORT));
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
