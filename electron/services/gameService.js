const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")
const os = require("os")
const userData = require('./settingsService.js')
const { shell } = require("electron")
const { https } = require("follow-redirects")
const AdmZip = require("adm-zip") // npm install adm-zip

let currentGameProcess = null
let startTime = null
let logStream = null
let proc = null

//
// =========================
// INTERNAL HELPERS
// =========================
//
function createLogFile(gamePath) {
    const logsDir = path.join(gamePath, "logs")

    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true })
    }

    const fileName = `game-${Date.now()}.log`
    const logPath = path.join(logsDir, fileName)

    logStream = fs.createWriteStream(logPath, { flags: "a" })

    return logPath
}

function getPlaytime() {
    if (!startTime) return 0
    return Math.floor((Date.now() - startTime) / 1000) // en secondes
}

//
// =========================
// LAUNCH GAME
// =========================
//
async function launchGame(gameData, callbacks = {}) {

    var args = [
        "/belaunch -be",
        gameData.suppArgs
    ]

    if (gameData.patched) {
        //Update du pseudo dans le fichier de config
        username = await userData.getSetting("username")
        await updateUsername(gameData.gameFolderPath, username)

        proc = spawn(gameData.exePath, args)
        currentGameProcess = proc
        startTime = Date.now()
        callbacks.onSuccess?.(gameData.seasonCode)
    } else {
        await patchGame(gameData)
        username = await userData.getSetting("username")
        await updateUsername(gameData.gameFolderPath, username)

        proc = spawn(gameData.exePath, args)
        currentGameProcess = proc
        startTime = Date.now()
        callbacks.onSuccess?.(gameData.seasonCode)
    }

    proc.on('close', (code) => {
        killGame()
        callbacks.onGameClosed?.()
    })
}

//
// =========================
// KILL GAME
// =========================
//
function killGame(callbacks = {}) {
    if (!currentGameProcess) {
        callbacks.onError?.("NO_PROCESS")
        return false
    }

    try {
        currentGameProcess.kill("SIGTERM")

        callbacks.onSuccess?.()
        return true
    } catch (e) {
        callbacks.onError?.(e.message)
        return false
    }
}

//
// =========================
// UNINSTALL GAME
// =========================
//
function uninstallGame(gamePath, callbacks = {}) {
    if (!fs.existsSync(gamePath)) {
        callbacks.onError?.("PATH_NOT_FOUND")
        return false
    }

    try {
        fs.rmSync(gamePath, { recursive: true, force: true })

        callbacks.onSuccess?.()
        return true
    } catch (e) {
        callbacks.onError?.(e.message)
        return false
    }
}

//
// =========================
// PATCH GAME
// =========================
//
async function patchGame(gameData) {
    const zipUrl = "https://github.com/lungu19/ThrowbackLoader/releases/download/1.0.1/ThrowbackLoader_1.0.1.zip"
    const zipPath = path.join(gameData.gameFolderPath, "patch.zip")

    await downloadFile(zipUrl, zipPath)

    unzipFile(zipPath, gameData.gameFolderPath)

    fs.unlinkSync(zipPath)

    var seasonIndex = userData.getSetting('installedGame').findIndex(game => game.seasonCode === gameData.seasonCode)
    var setting = 'installedGame[' + seasonIndex + '].patched'
    userData.setSetting(setting, true)
}

//
// =========================
// STATUS
// =========================
//
function isGameRunning() {
    // Vérifie si le processus du jeu est actif
    return currentGameProcess !== null
}

// OPEN GAME DIRECTORY
function openGameDir(path) {
    shell.openPath(path)
}

//UPDATE GAME ARGS
function updateGameArgs(seasonCode, args) {
    var seasonIndex = userData.getSetting('installedGame').findIndex(game => game.seasonCode === seasonCode)
    var setting = 'installedGame[' + seasonIndex + '].suppArgs'
    userData.setSetting(setting, args)
}

//DOWNLOAD PATCH
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest)

        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                return reject("DOWNLOAD_FAILED")
            }

            response.pipe(file)

            file.on("finish", () => {
                file.close(resolve)
            })
        }).on("error", (err) => {
            fs.unlink(dest, () => { })
            reject(err)
        })
    })
}

function unzipFile(zipPath, targetPath) {
    const zip = new AdmZip(zipPath)
    zip.extractAllTo(targetPath, true)
}

// UPDATE PATCH USERNAME
async function updateUsername(gamePath, username) {
    try {
        const configPath = path.join(gamePath, "ThrowbackLoader.toml")

        if (!fs.existsSync(configPath)) return

        let content = fs.readFileSync(configPath, "utf-8")

        content = content.replace(/username = .*/i, `username = '${username}'`)

        fs.writeFileSync(configPath, content)
    } catch (e) {
        console.error("Failed to update username:", e)
    }
}

//
// =========================
// EXPORTS
// =========================
//
module.exports = {
    launchGame,
    killGame,
    uninstallGame,
    patchGame,
    isGameRunning,
    openGameDir,
    updateGameArgs
}