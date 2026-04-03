const { spawn } = require("child_process")
const path = require("path")
const { app } = require("electron")
const userData = require('./settingsService.js')


function getDepotPath() {
    const basePath = app.isPackaged
        ? process.resourcesPath
        : app.getAppPath()

    return path.join(
        basePath,
        "steam",
        "depotdownloader",
        "DepotDownloader.exe"
    )
}

let currentLoginProcess = null
let currentProc = null

//
// =========================
// DOWNLOAD DEPOT
// =========================
//

class DownloadQueueManager {

    constructor(sendEvent) {
        this.queue = []
        this.currentJob = null
        this.currentProcess = null
        this.sendEvent = sendEvent
    }

    addJob(job) {

        // 🔁 Fusion des depots + languages
        const languageDepots = (job.languages || []).map(lang => ({
            steamdepot_id: lang.steamdepot_id,
            steamdepot_manifest_id: lang.steamdepot_manifest_id
        }))

        job.depots = [
            ...(job.depots || []),
            ...languageDepots
        ]

        job.id = job.SeasonCode
        job.status = "queued"
        job.progress = 0
        job.currentDepot = 0
        job.totalDepots = job.depots.length

        this.queue.push(job)

        this.sendEvent("queue-updated", this.queue)
        console.log("Current queue:", this.queue)

        if (!this.currentJob) {
            this.runNext()
        }
    }

    runNext() {
        if (this.queue.length === 0) {
            this.currentJob = null
            this.sendEvent("queue-empty")
            return
        }

        this.currentJob = this.queue.shift()
        this.currentJob.status = "downloading"

        this.sendEvent("job-started", {
            jobId: this.currentJob.id,
            name: this.currentJob.name
        })

        this.downloadDepots(this.currentJob)
    }

    downloadDepots(job) {
        let index = 0
        var fullGamePath = path.join(job.gamePath, job.SeasonCode)


        const nextDepot = () => {
            if (index >= job.depots.length) {
                job.status = "completed"
                job.progress = 100

                this.sendEvent("job-completed", {
                    seasonCode: this.currentJob.id,
                    gamePath: fullGamePath,
                    installedLanguages: this.currentJob.languages,
                })

                this.currentJob = null
                this.runNext()
                return
            }

            const depot = job.depots[index]

            console.log(`Starting download of depot ${depot.steamdepot_id} (manifest ${depot.steamdepot_manifest_id})`)

            const args = [
                "-app", "359550",
                "-depot", depot.steamdepot_id,
                "-manifest", depot.steamdepot_manifest_id,
                "-dir", fullGamePath,
                "-username", userData.getSetting('steam.lastUsername'), '-remember-password'
            ]

            this.currentProcess = spawn(getDepotPath(), args)

            this.sendEvent("depot-started", {
                jobId: job.id,
                depotId: depot.steamdepot_id,
                index,
                total: job.depots.length
            })

            this.currentProcess.stdout.on("data", (data) => {
                const output = data.toString()
                // console.log(output)

                // tentative parsing JSON (si modifié)
                try {
                    const parsed = JSON.parse(output)

                    job.progress =
                        ((index + parsed.percent / 100) / job.depots.length) * 100

                    this.sendEvent("job-progress", {
                        jobId: job.id,
                        progress: job.progress
                    })

                } catch { }
            })

            this.currentProcess.stderr.on("data", (data) => {
                this.sendEvent("job-error", {
                    jobId: job.id,
                    error: data.toString()
                })
            })

            this.currentProcess.on("close", (code) => {

                if (code !== 0) {
                    job.status = "error"
                    this.sendEvent("job-error", {
                        jobId: job.id,
                        code
                    })

                    this.currentJob = null
                    this.runNext()
                    return
                }

                index++
                job.currentDepot = index

                this.sendEvent("job-update", job)

                nextDepot()
            })
        }

        nextDepot()
    }

    stopCurrent() {
        this.currentProcess?.kill()
    }

    cancelJob(seasonCode) {
        if (this.currentJob && this.currentJob.id === seasonCode) {
            this.stopCurrent()
        }
        this.queue = this.queue.filter(job => job.id !== seasonCode)
        this.sendEvent("queue-updated", this.queue)
    }
}
//
// =========================
// LOGIN PASSWORD
// =========================
//
function loginWithPassword({ username, password }, callbacks = {}) {

    const depotPath = getDepotPath()
    console.log("Depot path:", depotPath)

    const args = [
        "-username", username.toString(),
        "-password", password.toString(),
        "-no-mobile",
        "-remember-password",
        "-app", "480",
        "-depot", "481"
    ]

    const proc = spawn(depotPath, args)

    let guardRequired = false

    proc.stdout.on("data", (data) => {
        const output = data.toString()

        console.log("DepotDownloader:", output)

        // 🔐 Steam Guard demandé
        if (output.includes("Steam Guard")) {
            guardRequired = true

            if (callbacks.onGuardRequired) {
                callbacks.onGuardRequired()
            }
        }

        // ✅ Connexion réussie
        if (output.includes("licenses for account!")) {
            if (callbacks.onSuccess) {
                callbacks.onSuccess({ username })
                proc.kill()
            }
        }

        // debug optionnel
        callbacks.onLog?.(output)
    })

    proc.stderr.on("data", (data) => {
        const output = data.toString()
        // console.error("DepotDownloader error? :", output)

        if (output.includes("STEAM GUARD! Please enter")) {
            callbacks.onGuardRequired?.("STEAM_GUARD_REQUIRED")
        } else if (output.includes("Rate Limit Exceeded")) {
            callbacks.onError?.("RATE_LIMIT")
        } else if (output.includes("InitializeSteam failed")) {
            callbacks.onError?.("INVALID_PASSWORD")
        } else {
            callbacks.onError?.(data.toString())
        }
    })

    // 👉 fonction pour envoyer le code Steam Guard
    function sendGuardCode(code) {
        proc.stdin.write(String(code) + "\n")
    }

    function kill() {
        if (proc && !proc.killed) {
            proc.kill("SIGKILL")
        }
    }

    return {
        sendGuardCode,
        kill,
        _proc: proc
    }
}

//
// =========================
// LOGIN QR CODE
// =========================
//
function loginWithQR(callbacks = {}) {

    const depotPath = getDepotPath()

    const args = [
        "-qr"
    ]

    const proc = spawn(depotPath, args)

    proc.stdout.on("data", (data) => {
        const output = data.toString()

        console.log("DepotDownloader:", output)


        // 📱 QR Code (texte brut ou ASCII)
        if (output.includes("QR")) {
            callbacks.onQR?.(output)
        }

        // ✅ Username après login
        const match = output.match(/Logged in as (.+)/)
        if (match) {
            const username = match[1].trim()
            callbacks.onSuccess?.({ username })
        }

        // ❌ erreurs
        if (output.includes("error") || output.includes("failed")) {
            callbacks.onError?.(output)
        }

        callbacks.onLog?.(output)
    })

    proc.stderr.on("data", (data) => {
        callbacks.onError?.(data.toString())
    })

    return proc
}


//SELECTED GAME INSTALL PATH
function selectGameDir() {
    const { dialog } = require("electron")
    const result = dialog.showOpenDialogSync({
        properties: ["openDirectory"]
    })
    if (result && result.length > 0) {
        return result[0]
    }
}

//
// =========================
// EXPORTS
// =========================
//
module.exports = {
    DownloadQueueManager,
    loginWithPassword,
    loginWithQR,
    selectGameDir,
    getDepotPath
}