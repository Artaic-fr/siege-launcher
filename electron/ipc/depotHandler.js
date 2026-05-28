const { ipcMain } = require("electron")
const { DownloadQueueManager, loginWithPassword, selectGameDir, getDepotPath, cancelJob, checkBaseGameOwnership } = require("../services/depotManager.js")

//
// =========================
// DOWNLOAD DEPOT
// =========================
//
let queueManager = null

ipcMain.handle("queue-init", (event) => {
  queueManager = new DownloadQueueManager((channel, data) => {
    event.sender.send(channel, data)
  })
})

ipcMain.handle("queue-add-job", (event, job) => {
  queueManager.addJob(job)
})

ipcMain.handle("queue-stop", () => {
  queueManager.stopCurrent()
})

//
// =========================
// LOGIN PASSWORD
// =========================
//
let currentLoginProcess = null

ipcMain.handle("steam-login-password", (event, credentials) => {

  if (currentLoginProcess?.kill) {
    currentLoginProcess.kill()
  }

  currentLoginProcess = loginWithPassword(credentials, {

    // 🔐 Steam Guard requis
    onGuardRequired: () => {
      event.sender.send("steam-guard-required")
    },

    // ✅ Succès
    onSuccess: (data) => {
      event.sender.send("steam-login-success", data)
      // Reprendre automatiquement les téléchargements après une connexion réussie
      if (queueManager) {
        queueManager.resumeJobs()
      }
    },

    // ❌ Erreur
    onError: (error) => {
      event.sender.send("steam-login-error", error)
    },

    // 🧾 Logs (optionnel debug)
    onLog: (log) => {
      event.sender.send("steam-login-log", log)
    }

  })
  return true
})

//
// =========================
// SEND STEAM GUARD CODE
// =========================
//
ipcMain.handle("steam-send-guard-code", (event, code) => {

  if (currentLoginProcess && currentLoginProcess.sendGuardCode) {
    currentLoginProcess.sendGuardCode(code)
    return true
  }
  return false
})

ipcMain.handle("steam-login-cancel", () => {
  if (currentLoginProcess?.kill) {
    currentLoginProcess.kill()
    currentLoginProcess = null
    return true
  }
  return false
})

ipcMain.handle("choose-game-dir", () => {
  return selectGameDir()
})

ipcMain.handle("download-queue", async (event, payload) => {

  await downloadQueue(payload, (progress) => {
    event.sender.send("queue-progress", progress)
  })

  return true
})

ipcMain.handle("exePath", (event) => {
  return getDepotPath()
})

ipcMain.handle("check-ownership", (event, callbacks) => {
  const proc = checkBaseGameOwnership({
    onSuccess: (ownership) => {
      console.log("Ownership check completed:", ownership)
      event.sender.send("check-ownership-result", ownership)
    },
    onError: (error) => {
      console.error("Ownership check error:", error)
      event.sender.send("check-ownership-error", error)
    },
    onLog: (log) => {
      console.log("Ownership check log:", log)
    }
  })
  return true
})

ipcMain.handle("queue-cancel-job", (event, seasonCode) => {
  if (queueManager) {
    queueManager.cancelJob(seasonCode)
    return true
  }
  return false
})

ipcMain.handle("queue-cancel-all-jobs", (event) => {
  if (queueManager) {
    queueManager.cancelAllJobs()
    return true
  }
  return false
})

ipcMain.handle("queue-resume-jobs", (event) => {
  if (queueManager) {
    queueManager.resumeJobs()
    return true
  }
  return false
})

ipcMain.handle('queue-log', (event, log) => {
  if (queueManager) {
    queueManager.sendEvent("queue-log", log)
  } else {
    console.log("Queue log:", log)
  }
})