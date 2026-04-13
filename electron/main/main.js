const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')

require('../ipc/ipcHandlers')
require('../ipc/settingsHandlers')
require('../ipc/depotHandler')
require('../ipc/gameHandler')

const settings = require('../services/settingsService')

let mainWindow = null

function sendUpdateMessage(channel, data) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send(channel, data)
  }
}

function initializeAutoUpdater() {
  autoUpdater.autoDownload = true
  autoUpdater.on('checking-for-update', () => {
    sendUpdateMessage('update-checking')
  })

  autoUpdater.on('update-available', (info) => {
    sendUpdateMessage('update-available', info)
  })

  autoUpdater.on('update-not-available', (info) => {
    sendUpdateMessage('update-not-available', info)
  })

  autoUpdater.on('error', (err) => {
    sendUpdateMessage('update-error', err == null ? 'unknown' : (err.stack || err).toString())
  })

  autoUpdater.on('download-progress', (progressObj) => {
    sendUpdateMessage('update-download-progress', progressObj)
  })

  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateMessage('update-downloaded', info)
    const buttonIndex = dialog.showMessageBoxSync(mainWindow, {
      type: 'info',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Mise à jour prête',
      message: 'Une nouvelle version a été téléchargée. Voulez-vous redémarrer l’application maintenant pour installer la mise à jour ?'
    })
    if (buttonIndex === 0) {
      autoUpdater.quitAndInstall()
    }
  })
}

ipcMain.handle('check-for-updates', async () => {
  try {
    await autoUpdater.checkForUpdates()
    return true
  } catch (error) {
    return { error: error == null ? 'unknown' : (error.stack || error).toString() }
  }
})

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
  mainWindow = win
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../..', 'dist', 'index.html'))
  }
}

app.whenReady().then(async () => {
  await settings.initStore(app)

  app.setAppUserModelId('com.siegelauncher.desktop')
  createWindow()

  if (!process.env.VITE_DEV_SERVER_URL) {
    initializeAutoUpdater()
    autoUpdater.checkForUpdatesAndNotify()
  }
})

app.on('window-all-closed', () => {
  app.quit()
})