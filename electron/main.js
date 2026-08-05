const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { app, BrowserWindow, ipcMain, session, shell } = require("electron");
const store = require("./content-store");

let mainWindow = null;
let appSettingsWindow = null;
const animalSettingsWindows = new Map();
const animalInfoWindows = new Map();
const recordingWindows = new Map();
const recordingSessions = new Map();

function createBaseWindowConfig(settings) {
  return {
    backgroundColor: "#081219",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    title: settings.windowTitle || "Museum Animal Sound Wall",
  };
}

function revealWhenReady(windowRef) {
  windowRef.once("ready-to-show", () => {
    if (!windowRef.isDestroyed()) {
      windowRef.show();
      windowRef.focus();
    }
  });
}

async function createMainWindow() {
  const { settings } = await store.loadAppData();

  mainWindow = new BrowserWindow({
    ...createBaseWindowConfig(settings),
    width: settings.windowWidth || 1680,
    height: settings.windowHeight || 760,
    minWidth: 1400,
    minHeight: 620,
  });

  revealWhenReady(mainWindow);
  await mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
}

async function openAppSettingsWindow() {
  const { settings } = await store.loadAppData();

  if (appSettingsWindow && !appSettingsWindow.isDestroyed()) {
    appSettingsWindow.focus();
    return appSettingsWindow;
  }

  appSettingsWindow = new BrowserWindow({
    ...createBaseWindowConfig(settings),
    title: "Museum App Settings",
    width: 1180,
    height: 900,
    minWidth: 980,
    minHeight: 760,
    parent: mainWindow || undefined,
  });

  appSettingsWindow.on("closed", () => {
    appSettingsWindow = null;
  });

  revealWhenReady(appSettingsWindow);
  await appSettingsWindow.loadFile(
    path.join(__dirname, "..", "renderer", "app-settings.html"),
  );
  return appSettingsWindow;
}

async function openAnimalSettingsWindow(folderName) {
  const { settings } = await store.loadAppData();
  const existingWindow = animalSettingsWindows.get(folderName);

  if (existingWindow && !existingWindow.isDestroyed()) {
    existingWindow.focus();
    return existingWindow;
  }

  const windowRef = new BrowserWindow({
    ...createBaseWindowConfig(settings),
    title: `Edit ${folderName}`,
    width: 1240,
    height: 960,
    minWidth: 1060,
    minHeight: 760,
    parent: mainWindow || undefined,
  });

  animalSettingsWindows.set(folderName, windowRef);
  windowRef.on("closed", () => {
    animalSettingsWindows.delete(folderName);
  });

  revealWhenReady(windowRef);
  await windowRef.loadFile(path.join(__dirname, "..", "renderer", "animal-settings.html"), {
    query: { folderName },
  });
  return windowRef;
}

async function openAnimalInfoWindow(folderName) {
  const { settings } = await store.loadAppData();
  const existingWindow = animalInfoWindows.get(folderName);

  if (existingWindow && !existingWindow.isDestroyed()) {
    existingWindow.focus();
    return existingWindow;
  }

  const windowRef = new BrowserWindow({
    ...createBaseWindowConfig(settings),
    title: `${folderName} Info`,
    width: 1320,
    height: 920,
    minWidth: 900,
    minHeight: 680,
    parent: mainWindow || undefined,
  });

  animalInfoWindows.set(folderName, windowRef);
  windowRef.on("closed", () => {
    animalInfoWindows.delete(folderName);
  });

  revealWhenReady(windowRef);
  await windowRef.loadFile(path.join(__dirname, "..", "renderer", "animal-info.html"), {
    query: { folderName },
  });
  return windowRef;
}

async function openRecordingWindow(sessionId) {
  const { settings } = await store.loadAppData();
  const existingWindow = recordingWindows.get(sessionId);

  if (existingWindow && !existingWindow.isDestroyed()) {
    existingWindow.focus();
    return existingWindow;
  }

  const recordingWindow = new BrowserWindow({
    ...createBaseWindowConfig(settings),
    title: "Record Animal Audio",
    width: 980,
    height: 900,
    minWidth: 820,
    minHeight: 700,
    parent: mainWindow || undefined,
  });

  recordingWindows.set(sessionId, recordingWindow);
  recordingWindow.on("closed", () => {
    recordingWindows.delete(sessionId);
    recordingSessions.delete(sessionId);
  });

  revealWhenReady(recordingWindow);
  await recordingWindow.loadFile(path.join(__dirname, "..", "renderer", "recording.html"), {
    query: { sessionId },
  });

  return recordingWindow;
}

function broadcastContentChanged(reason) {
  BrowserWindow.getAllWindows().forEach((windowRef) => {
    if (!windowRef.isDestroyed()) {
      windowRef.webContents.send("content:changed", { reason });
    }
  });
}

function configureMediaPermissions() {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === "media" || permission === "audioCapture" || permission === "microphone") {
      callback(true);
      return;
    }

    callback(false);
  });

  if (typeof session.defaultSession.setPermissionCheckHandler === "function") {
    session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
      return (
        permission === "media" ||
        permission === "audioCapture" ||
        permission === "microphone"
      );
    });
  }
}

app.whenReady().then(async () => {
  configureMediaPermissions();

  ipcMain.handle("content:load", async () => store.loadAppData());
  ipcMain.handle("content:saveAppSettings", async (_event, payload) => {
    const result = await store.saveAppSettings(payload.settings, payload.body);
    broadcastContentChanged("settings-saved");
    return result;
  });
  ipcMain.handle("content:saveAnimal", async (_event, payload) => {
    const result = await store.saveAnimalBundle(payload.folderName, payload.draft);
    broadcastContentChanged("animal-saved");
    return result;
  });
  ipcMain.handle("content:importAudioClip", async (_event, payload) => {
    const result = await store.importAudioClip(payload);
    broadcastContentChanged("audio-imported");
    return result;
  });
  ipcMain.handle("content:importAudioClipFromYouTube", async (_event, payload) => {
    const result = await store.importAudioClipFromYouTube(payload);
    broadcastContentChanged("youtube-audio-imported");
    return result;
  });
  ipcMain.handle("content:importVideoFile", async (_event, payload) => {
    const result = await store.importVideoFile(payload);
    broadcastContentChanged("video-imported");
    return result;
  });
  ipcMain.handle("content:readBinary", async (_event, payload) =>
    store.readBinaryFile(payload.filePath),
  );
  ipcMain.handle("content:openAppSettingsWindow", async () => {
    await openAppSettingsWindow();
    return true;
  });
  ipcMain.handle("content:openAnimalSettingsWindow", async (_event, payload) => {
    await openAnimalSettingsWindow(payload.folderName);
    return true;
  });
  ipcMain.handle("content:openAnimalInfoWindow", async (_event, payload) => {
    await openAnimalInfoWindow(payload.folderName);
    return true;
  });
  ipcMain.handle("content:openRecordingWindow", async (_event, payload) => {
    const sessionId = randomUUID();
    recordingSessions.set(sessionId, payload);
    await openRecordingWindow(sessionId);
    return { sessionId };
  });
  ipcMain.handle("content:loadRecordingSession", async (_event, payload) => {
    return recordingSessions.get(payload.sessionId) || null;
  });
  ipcMain.handle("content:saveRecordedClip", async (_event, payload) => {
    const sessionPayload = recordingSessions.get(payload.sessionId);
    if (!sessionPayload) {
      throw new Error("The recording session expired. Re-open the recording window.");
    }

    const result = await store.saveRecordedClip(sessionPayload, payload);
    broadcastContentChanged("recording-saved");
    return result;
  });
  ipcMain.handle("content:openAnimalsFolder", async () => shell.openPath(store.ANIMALS_DIR));
  ipcMain.handle("content:revealAnimalFolder", async (_event, payload) =>
    shell.openPath(path.join(store.ANIMALS_DIR, payload.folderName)),
  );
  ipcMain.handle("content:revealAnimalGuestRecordingsFolder", async (_event, payload) =>
    shell.openPath(path.join(store.ANIMALS_DIR, payload.folderName, "guest-recordings")),
  );
  ipcMain.handle("content:revealAppSettings", async () => shell.openPath(store.APP_SETTINGS_PATH));
  ipcMain.handle("window:closeCurrent", async (event) => {
    const currentWindow = BrowserWindow.fromWebContents(event.sender);
    if (currentWindow && !currentWindow.isDestroyed()) {
      currentWindow.close();
    }
    return true;
  });

  await createMainWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
