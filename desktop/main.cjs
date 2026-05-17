const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const { app, BrowserWindow, dialog, shell } = require("electron");

const DEV_URL = process.env.ELECTRON_START_URL;
const HOST = "127.0.0.1";
const PORT = Number(process.env.ELECTRON_PORT || 43110);
const APP_ICON_PATH = path.join(
  app.getAppPath(),
  "assets",
  process.platform === "darwin" ? "icon-big.png" : "icon.ico",
);
const UPDATE_MANIFEST_URL =
  process.env.CALCIFY_UPDATE_MANIFEST_URL ||
  "https://calcify.app/api/desktop/latest";
const UPDATE_CHECK_DELAY_MS = 5000;
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

let mainWindow = null;
let staticServer = null;
let isQuitting = false;
let lastPromptedUpdateVersion = null;

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

function normalizeVersion(version) {
  return String(version || "")
    .trim()
    .replace(/^v/i, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
}

function isNewerVersion(latestVersion, currentVersion) {
  const latestParts = normalizeVersion(latestVersion);
  const currentParts = normalizeVersion(currentVersion);
  const length = Math.max(latestParts.length, currentParts.length);

  for (let index = 0; index < length; index += 1) {
    const latestPart = latestParts[index] || 0;
    const currentPart = currentParts[index] || 0;

    if (latestPart > currentPart) {
      return true;
    }

    if (latestPart < currentPart) {
      return false;
    }
  }

  return false;
}

function getDownloadUrl(downloads) {
  if (!downloads || typeof downloads !== "object") {
    return null;
  }

  const url = downloads[process.platform];
  return typeof url === "string" && url.startsWith("http") ? url : null;
}

async function checkForDesktopUpdate() {
  if (DEV_URL || !UPDATE_MANIFEST_URL) {
    return;
  }

  try {
    const response = await fetch(UPDATE_MANIFEST_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    const manifest = await response.json();
    const latestVersion = manifest?.latestVersion;
    const downloadUrl = getDownloadUrl(manifest?.downloads);

    if (
      !latestVersion ||
      latestVersion === lastPromptedUpdateVersion ||
      !downloadUrl ||
      !isNewerVersion(latestVersion, app.getVersion())
    ) {
      return;
    }

    lastPromptedUpdateVersion = latestVersion;

    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["Atualizar agora", "Depois"],
      defaultId: 0,
      cancelId: 1,
      title: "Atualizacao disponivel",
      message: `Calcify ${latestVersion} ja esta disponivel.`,
      detail:
        "Sua versao esta desatualizada. Baixe a nova versao e instale quando for um bom momento para reiniciar o app.",
    });

    if (result.response === 0) {
      await shell.openExternal(downloadUrl);
    }
  } catch (error) {
    console.warn("Nao foi possivel verificar atualizacoes:", error);
  }
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
    setTimeout(() => {
      checkForDesktopUpdate();
    }, UPDATE_CHECK_DELAY_MS);
    setInterval(() => {
      checkForDesktopUpdate();
    }, UPDATE_CHECK_INTERVAL_MS);
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
