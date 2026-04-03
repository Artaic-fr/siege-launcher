const { contextBridge, ipcRenderer, app } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getSeasons: () => ipcRenderer.invoke('get-seasons'),
  getOperators: (opName) => ipcRenderer.invoke('get-operators', opName)
})

//Settings
contextBridge.exposeInMainWorld("settings", {
  get: (key) =>
    ipcRenderer.invoke("settings-get", key),
  set: (key, value) =>
    ipcRenderer.invoke("settings-set", key, value),
  homeDir: () =>
    ipcRenderer.invoke("settings-homeDir"),
  openAppDir: () =>
    ipcRenderer.invoke("openAppdir"),
  selectGameDir: () =>
    ipcRenderer.invoke("selectGameDir"),
  add: (gameData) =>
    ipcRenderer.invoke('addInstalled', gameData),
  getInstalled: () =>
    ipcRenderer.invoke('getInstalled'),
  getDiskSpace: (path) =>
    ipcRenderer.invoke('getDiskSpace', path)
})

//Depot Downloader
contextBridge.exposeInMainWorld("steam", {
  downloadDepot: (options) =>
    ipcRenderer.invoke("download-depot", options),
  loginPassword: (username, password) =>
    ipcRenderer.invoke("steam-login-password", { username, password }),
  sendGuardCode: (code) =>
    ipcRenderer.invoke("steam-send-guard-code", code),
  onProgress: (callback) =>
    ipcRenderer.on("depot-progress", (_, data) => callback(data)),
  onGuardRequired: (callback) =>
    ipcRenderer.on("steam-guard-required", callback),
  onLoginSuccess: (callback) =>
    ipcRenderer.on("steam-login-success", (_, data) => callback(data)),
  onLoginError: (callback) =>
    ipcRenderer.on("steam-login-error", (_, err) => callback(err)),
  onLoginLog: (callback) =>
    ipcRenderer.on("steam-login-log", (_, log) => callback(log)),
  cancelLogin: () =>
    ipcRenderer.invoke("steam-login-cancel"),
  chooseGameDir: () =>
    ipcRenderer.invoke("choose-game-dir"),
  downloadQueue: (payload) =>
    ipcRenderer.invoke("download-queue", payload),
  onQueueProgress: (callback) =>
    ipcRenderer.on("queue-progress", (_, data) => callback(data)),
  exePath: () =>
    ipcRenderer.invoke("exePath")
})

contextBridge.exposeInMainWorld("queue", {
  init: () => ipcRenderer.invoke("queue-init"),
  addJob: (job) => ipcRenderer.invoke("queue-add-job", job),
  stop: () => ipcRenderer.invoke("queue-stop"),
  onJobProgress: (cb) =>
    ipcRenderer.on("job-progress", (_, d) => cb(d)),
  onJobStarted: (cb) =>
    ipcRenderer.on("job-started", (_, d) => cb(d)),
  onJobCompleted: (cb) =>
    ipcRenderer.on("job-completed", (_, d) => cb(d)),
  onQueueUpdated: (cb) =>
    ipcRenderer.on("queue-updated", (_, d) => cb(d)),
  cancelJob: (seasonCode) => ipcRenderer.invoke("queue-cancel-job", seasonCode)
})

contextBridge.exposeInMainWorld("game", {
  openGameDir: (path) => ipcRenderer.invoke("openGameDir", path),
  updateArgs: (seasonCode, args) => ipcRenderer.invoke('updateArgs', seasonCode, args),
  uninstall: (path) => ipcRenderer.invoke('uninstall', path),
  launch: (gameData) => ipcRenderer.invoke('launchGame', gameData),
  gameLaunched: (callback) => ipcRenderer.on("game-launched", (_, data) => callback(data)),
  close: () => ipcRenderer.invoke('closeGame'),
  gameClosed: (callback) => ipcRenderer.on("game-closed", callback)
})