const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApi", {
  loadAppData: () => ipcRenderer.invoke("content:load"),
  saveAppSettings: (settings, body) =>
    ipcRenderer.invoke("content:saveAppSettings", { settings, body }),
  saveAnimal: (folderName, draft) =>
    ipcRenderer.invoke("content:saveAnimal", { folderName, draft }),
  importAudioClip: (payload) => ipcRenderer.invoke("content:importAudioClip", payload),
  importAudioClipFromYouTube: (payload) =>
    ipcRenderer.invoke("content:importAudioClipFromYouTube", payload),
  importVideoFile: (payload) => ipcRenderer.invoke("content:importVideoFile", payload),
  readBinaryFile: async (filePath) => {
    const data = await ipcRenderer.invoke("content:readBinary", { filePath });
    return new Uint8Array(data);
  },
  openAppSettingsWindow: () => ipcRenderer.invoke("content:openAppSettingsWindow"),
  openAnimalSettingsWindow: (folderName) =>
    ipcRenderer.invoke("content:openAnimalSettingsWindow", { folderName }),
  openAnimalInfoWindow: (folderName) =>
    ipcRenderer.invoke("content:openAnimalInfoWindow", { folderName }),
  openRecordingWindow: (payload) => ipcRenderer.invoke("content:openRecordingWindow", payload),
  loadRecordingSession: (sessionId) =>
    ipcRenderer.invoke("content:loadRecordingSession", { sessionId }),
  saveRecordedClip: (payload) => ipcRenderer.invoke("content:saveRecordedClip", payload),
  openAnimalsFolder: () => ipcRenderer.invoke("content:openAnimalsFolder"),
  revealAnimalFolder: (folderName) =>
    ipcRenderer.invoke("content:revealAnimalFolder", { folderName }),
  revealAnimalGuestRecordingsFolder: (folderName) =>
    ipcRenderer.invoke("content:revealAnimalGuestRecordingsFolder", { folderName }),
  revealAppSettings: () => ipcRenderer.invoke("content:revealAppSettings"),
  closeCurrentWindow: () => ipcRenderer.invoke("window:closeCurrent"),
  onContentChanged: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("content:changed", listener);
    return () => ipcRenderer.removeListener("content:changed", listener);
  },
});
