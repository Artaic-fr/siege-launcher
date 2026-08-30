const { app, BrowserWindow, dialog, ipcMain, session } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')
const { isDownloadInProgress } = require('../services/depotManager.js')

app.isQuiting = false

require('../ipc/ipcHandlers')
require('../ipc/settingsHandlers')
require('../ipc/depotHandler')
require('../ipc/gameHandler')
require('../ipc/netcoreHandler')

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
      title: 'Update Ready',
      message: 'A new version has been downloaded. Do you want to restart the application now to install the update?'
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
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow = win

  win.on('close', (event) => {
    if (isDownloadInProgress() && !app.isQuiting) {
      event.preventDefault()

      if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
        win.webContents.send('download-close-confirmation-request')
      }
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../..', 'dist', 'index.html'))
  }

  // Vérifier NetCore 9.0 après le chargement de la page
  win.webContents.on('did-finish-load', () => {
    sendUpdateMessage('check-netcore')
  })
}

ipcMain.handle('confirm-close-download', () => {
  app.isQuiting = true

  const queueManager = global.__launcher_queue_manager
  if (queueManager && typeof queueManager.cancelAllJobs === 'function') {
    queueManager.cancelAllJobs()
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close()
  } else {
    app.exit()
  }

  return true
})

app.on('before-quit', (event) => {
  if (isDownloadInProgress() && !app.isQuiting) {
    event.preventDefault()

    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('download-close-confirmation-request')
    }
  }
})

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