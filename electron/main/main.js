const { app, BrowserWindow } = require('electron')
const path = require('path')

require('../ipc/ipcHandlers')
require('../ipc/settingsHandlers')
require('../ipc/depotHandler')
require('../ipc/gameHandler')

const settings = require('../services/settingsService')

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../../shared/icon.png'),

    minWidth: 1000,
    minHeight: 800,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../..', 'dist', 'index.html'))
  }
}

app.whenReady().then(async () => {
  await settings.initStore(app)

  createWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})