const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")
const os = require("os")
const userData = require('./settingsService.js')
const { shell } = require("electron")
const { https } = require("follow-redirects")
const AdmZip = require("adm-zip")

let currentGameProcess = null
let currentGameData = null
let startTime = null
let logStream = null
let proc = null
let saveOnCloseDone = false

//
// =========================
// INTERNAL HELPERS
// =========================
//
function getThrowbackSaveDir(gameData) {
    return path.join(gameData.gameFolderPath, "ThrowbackLoaderSaves")
}

function getSharedSaveDir() {
    return path.resolve(__dirname, "..", "..", "shared", "saves")
}

function ensureDirectory(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

function clearDirectory(dir) {
    if (!fs.existsSync(dir)) return

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const entryPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
            fs.rmSync(entryPath, { recursive: true, force: true })
        } else {
            fs.unlinkSync(entryPath)
        }
    }
}

function copyDirectoryContents(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) return

    ensureDirectory(destDir)

    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const srcPath = path.join(srcDir, entry.name)
        const destPath = path.join(destDir, entry.name)

        if (entry.isDirectory()) {
            copyDirectoryContents(srcPath, destPath)
        } else if (entry.isFile() || entry.isSymbolicLink()) {
            fs.copyFileSync(srcPath, destPath)
        }
    }
}

function backupThrowbackSaves(gameData) {
    const saveDir = getThrowbackSaveDir(gameData)
    const sharedDir = getSharedSaveDir()

    ensureDirectory(sharedDir)
    clearDirectory(sharedDir)

    if (!fs.existsSync(saveDir)) return

    copyDirectoryContents(saveDir, sharedDir)
}

function restoreThrowbackSaves(gameData) {
    const saveDir = getThrowbackSaveDir(gameData)
    const sharedDir = getSharedSaveDir()

    ensureDirectory(saveDir)

    if (!fs.existsSync(sharedDir)) return

    clearDirectory(saveDir)
    copyDirectoryContents(sharedDir, saveDir)
}

function saveCurrentGameSaves() {
    if (!currentGameData || saveOnCloseDone) return

    saveOnCloseDone = true
    try {
        backupThrowbackSaves(currentGameData)
    } catch (e) {
        console.error("Failed to backup ThrowbackLoader saves:", e)
    }
}

function clearCurrentGameState() {
    currentGameProcess = null
    currentGameData = null
    startTime = null
    saveOnCloseDone = false
}

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
        // "/belaunch -be",
        "/belaunch",
        "/nologo",
        gameData.suppArgs
    ]

    if (!gameData.patched) {
        await patchGame(gameData)
    }

    restoreThrowbackSaves(gameData)

    // Update du pseudo dans le fichier de config
    const username = await userData.getSetting("username")
    await updateUsername(gameData.gameFolderPath, username)

    proc = spawn(gameData.exePath, args)
    currentGameProcess = proc
    currentGameData = gameData
    startTime = Date.now()
    callbacks.onSuccess?.(gameData.seasonCode)

    proc.on('close', (code) => {
        saveCurrentGameSaves()
        clearCurrentGameState()
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
        saveCurrentGameSaves()
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