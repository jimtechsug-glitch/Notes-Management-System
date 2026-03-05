const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const waitOn = require("wait-on");

let mainWindow;
let serverProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: "Nsoma-DigLibs",
        icon: path.join(__dirname, "client", "public", "assets", "img", "logo.png"),
    });

    // Load the local server
    mainWindow.loadURL("http://localhost:5000");

    mainWindow.on("closed", function () {
        mainWindow = null;
    });
}

function startServer() {
    // Run the express server
    // DB_DIALECT=sqlite tells the backend to use the local file database
    const env = { ...process.env, DB_DIALECT: "sqlite", PORT: 5000 };

    // Use the built-in node to run the server
    serverProcess = spawn("node", [path.join(__dirname, "server", "server.js")], {
        env,
        stdio: "inherit",
    });

    serverProcess.on("error", (err) => {
        console.error("Failed to start server process.", err);
    });
}

app.on("ready", async () => {
    startServer();

    // Wait for the server to be up before creating the window
    try {
        await waitOn({
            resources: ["http-get://localhost:5000/api/test"],
            timeout: 15000,
        });
        createWindow();
    } catch (err) {
        console.error("Server did not start in time:", err);
        app.quit();
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

// Cleanup server process on exit
app.on("will-quit", () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});
