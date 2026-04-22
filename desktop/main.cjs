const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const { app, BrowserWindow } = require("electron");

const DEV_URL = process.env.ELECTRON_START_URL;
const HOST = "127.0.0.1";
const PORT = Number(process.env.ELECTRON_PORT || 43110);
const APP_ICON_PATH = path.join(
  app.getAppPath(),
  "assets",
  process.platform === "darwin" ? "icon-big.png" : "icon.ico",
);

let mainWindow = null;
let staticServer = null;
let isQuitting = false;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return contentTypes[ext] || "application/octet-stream";
}

async function pathExists(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function resolveStaticPath(baseDir, pathname) {
  const safePath = decodeURIComponent(pathname).replace(/^\/+/, "");

  const candidates = [
    safePath === "" ? "index.html" : safePath,
    safePath === "" ? null : `${safePath}.html`,
    safePath === "" ? null : path.join(safePath, "index.html"),
  ].filter(Boolean);

  for (const relativePath of candidates) {
    const absolutePath = path.join(baseDir, relativePath);

    if (!absolutePath.startsWith(baseDir)) {
      continue;
    }

    if (await pathExists(absolutePath)) {
      return absolutePath;
    }
  }

  const notFoundPath = path.join(baseDir, "404.html");
  if (await pathExists(notFoundPath)) {
    return notFoundPath;
  }

  return null;
}

async function startStaticServer() {
  if (staticServer?.listening) {
    return `http://${HOST}:${PORT}`;
  }

  const baseDir = path.join(app.getAppPath(), "out");

  staticServer = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", `http://${HOST}:${PORT}`);
      const filePath = await resolveStaticPath(baseDir, requestUrl.pathname);

      if (!filePath) {
        response.writeHead(404, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end("Not Found");
        return;
      }

      const fileContent = await fs.readFile(filePath);
      response.writeHead(filePath.endsWith("404.html") ? 404 : 200, {
        "Content-Type": getContentType(filePath),
      });
      response.end(fileContent);
    } catch (error) {
      console.error("Falha ao servir arquivo estatico:", error);
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Internal Server Error");
    }
  });

  await new Promise((resolve, reject) => {
    staticServer.once("error", reject);
    staticServer.listen(PORT, HOST, resolve);
  });

  return `http://${HOST}:${PORT}`;
}

function closeStaticServer() {
  if (!staticServer?.listening) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    staticServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function createMainWindow() {
  if (process.platform === "darwin" && app.dock?.setIcon) {
    try {
      if (await pathExists(APP_ICON_PATH)) {
        app.dock.setIcon(APP_ICON_PATH);
      }
    } catch (error) {
      console.warn("Nao foi possivel aplicar o icone do dock:", error);
    }
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: "#0b1220",
    icon: APP_ICON_PATH,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  if (DEV_URL) {
    await mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    const appUrl = await startStaticServer();
    await mainWindow.loadURL(appUrl);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await createMainWindow();
  } catch (error) {
    console.error("Falha ao iniciar o app desktop:", error);
    app.quit();
    return;
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow().catch((error) => {
        console.error("Falha ao recriar janela:", error);
      });
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async (event) => {
  if (isQuitting || DEV_URL) {
    return;
  }

  event.preventDefault();
  isQuitting = true;

  try {
    await closeStaticServer();
  } catch (error) {
    console.error("Falha ao encerrar servidor estatico:", error);
  }

  app.quit();
});
