const { ipcMain, app } = require("electron")
const store = require("../services/settingsService.js")

ipcMain.handle("settings-get", (_, key) => {
  return store.getSetting(key)
})

ipcMain.handle("settings-set", (_, key, value) => {
  store.setSetting(key, value)
})

ipcMain.handle("settings-homeDir", () => {
  return store.homeDir()
})

ipcMain.handle("openAppdir", async () => {
  store.openAppDir()
})

ipcMain.handle("selectGameDir", async () => {
  return await store.selectGameDir()
})

ipcMain.handle("addInstalled", (event, gameData) => {
  store.pushSetting("installedGame", gameData)
  console.log(gameData)
  return true
})

ipcMain.handle('getInstalled', () =>{
  return store.getSetting('installedGame')
})

ipcMain.handle('getDiskSpace', async (event, path) => {
  return await store.getDiskSpace(path)
})