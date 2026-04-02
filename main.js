const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Load baked-in keys from config/keys.js
const bakedKeys = require("./server/config/keys");
if (bakedKeys.OPENAI_API_KEY)
  process.env.OPENAI_API_KEY = bakedKeys.OPENAI_API_KEY;
if (bakedKeys.GEMINI_API_KEY)
  process.env.GEMINI_API_KEY = bakedKeys.GEMINI_API_KEY;

// Set up paths for production (all-users shared DB on Windows)
const isDev = !app.isPackaged;
const programDataRoot =
  process.env.PROGRAMDATA || path.join(os.homedir(), "AppData", "Local");
const sharedDataPath = path.join(programDataRoot, "Nsoma-DigLibs");
if (!fs.existsSync(sharedDataPath)) {
  fs.mkdirSync(sharedDataPath, { recursive: true });
}
const dbPath = path.join(sharedDataPath, "database.sqlite");

// API server URL mode
const defaultLocalServer = "http://localhost:5000";
const serverUrl = process.env.APP_SERVER_URL || defaultLocalServer;
const isRemoteServer =
  !serverUrl.startsWith("http://localhost") &&
  !serverUrl.startsWith("http://127.0.0.1") &&
  !serverUrl.startsWith("https://localhost");

// Ensure database exists in writable location
if (!fs.existsSync(dbPath)) {
  const templatePath = path.join(__dirname, "database.sqlite");
  if (fs.existsSync(templatePath)) {
    try {
      fs.copyFileSync(templatePath, dbPath);
      console.log("Database copied successfully to shared path");
    } catch (e) {
      console.error("Failed to copy database template", e);
    }
  } else {
    console.log("Template database not found at", templatePath);
  }
}

// Pass configuration to the server via environment variables
process.env.DATABASE_STORAGE = dbPath;
process.env.NODE_ENV = isDev ? "development" : "production";
process.env.PORT = "5000";

// For packaged app, ensure uploads are placed in user-writable path.
let uploadsPath;
try {
  const userDataUploads = path.join(app.getPath("userData"), "uploads");
  fs.mkdirSync(userDataUploads, { recursive: true });
  console.log(`Created/verified userData uploads dir at ${userDataUploads}`);
  uploadsPath = userDataUploads;
} catch (err) {
  console.warn(
    `Unable to create userData uploads dir: ${err.message}. Falling back to temp directory.`,
  );
  const tempUploads = path.join(os.tmpdir(), "Nsoma-DigLibs", "uploads");
  fs.mkdirSync(tempUploads, { recursive: true });
  console.log(`Created/verified temp uploads dir at ${tempUploads}`);
  uploadsPath = tempUploads;
}
process.env.UPLOADS_PATH = uploadsPath;

let mainWindow;

function createWindow() {
  console.log("Creating window");
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "Nsoma-DigLibs",
    icon: path.join(
      __dirname,
      "client",
      "public",
      "assets",
      "images",
      "logo.png",
    ),
  });

  mainWindow.loadURL(serverUrl);

  mainWindow.on("closed", function () {
    mainWindow = null;
  });

  // Add shortcuts
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.control && input.key.toLowerCase() === "r") {
      mainWindow.reload();
      event.preventDefault();
    }
    if (input.key === "F5") {
      mainWindow.reload();
      event.preventDefault();
    }
  });
}

async function startServer() {
  try {
    console.log("Starting server");
    // Start the server directly in the main process
    // This removes the need for a separate 'node' executable
    require("./server/server.js");
    console.log("Server required successfully");
  } catch (err) {
    console.error("Server start error:", err);
    dialog.showErrorBox(
      "Server Start Error",
      "The internal server failed to start: " + err.message,
    );
    app.quit();
  }
}

app.on("ready", async () => {
  console.log("App ready, serverUrl=%s", serverUrl);

  if (!isRemoteServer) {
    await startServer();
    // Wait for local server to start
    setTimeout(() => {
      console.log("Creating window after delay for local server");
      createWindow();
    }, 2000);
  } else {
    console.log("Remote server mode, skipping local server startup");
    createWindow();
  }
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});
