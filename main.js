const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

// Set up paths for production
const isDev = !app.isPackaged;
const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "database.sqlite");

// Ensure database exists in writable location
if (!fs.existsSync(dbPath)) {
  const templatePath = path.join(__dirname, "database.sqlite");
  if (fs.existsSync(templatePath)) {
    try {
      fs.copyFileSync(templatePath, dbPath);
      console.log("Database copied successfully");
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

  mainWindow.loadURL("http://localhost:5000");

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
  console.log("App ready");
  await startServer();
  // Wait a bit for server to start
  setTimeout(() => {
    console.log("Creating window after delay");
    createWindow();
  }, 2000);
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
