const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")
const os = require("os")
const userData = require('./settingsService.js')
const { shell, app } = require("electron")
const { https } = require("follow-redirects")
const AdmZip = require("adm-zip")

let currentGameProcess = null
let currentGameData = null
let startTime = null
let logStream = null
let proc = null
let saveOnCloseDone = false
let currentModProcesses = []
let gameCloseMonitor = null

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

function getModsDir() {
    const modsDir = path.join(app.getPath('userData'), 'mods')
    ensureDirectory(modsDir)
    return modsDir
}

function clearCurrentGameState() {
    currentGameProcess = null
    currentGameData = null
    startTime = null
    saveOnCloseDone = false
    currentModProcesses = []
    if (gameCloseMonitor) {
        clearInterval(gameCloseMonitor)
        gameCloseMonitor = null
    }
}

function closeModProcesses() {
    for (const modEntry of currentModProcesses) {
        const modProcess = modEntry?.proc
        const modPath = modEntry?.modPath
        if (!modProcess || !modProcess.pid) continue

        const fileName = modPath ? path.basename(modPath) : null
        console.log(`Closing mod process PID=${modProcess.pid}${fileName ? ` (${fileName})` : ''}`)

        try {
            if (process.platform === 'win32') {
                const killByPid = spawn('taskkill', ['/PID', modProcess.pid.toString(), '/T', '/F'], {
                    windowsHide: true,
                    stdio: 'ignore'
                })
                killByPid.on('error', (error) => {
                    console.error('Failed to taskkill mod process by PID:', error)
                })
                if (fileName) {
                    const killByName = spawn('taskkill', ['/IM', fileName, '/F'], {
                        windowsHide: true,
                        stdio: 'ignore'
                    })
                    killByName.on('error', (error) => {
                        console.error('Failed to taskkill mod process by name:', error)
                    })
                }
            }

            if (!modProcess.killed) {
                modProcess.kill('SIGTERM')
            }
        } catch (error) {
            console.error('Failed to kill mod process:', error)
        }
    }
    currentModProcesses = []
}

function loadAvailableMods() {
    const filePath = path.join(app.getAppPath(), 'shared', 'mods.json')
    if (!fs.existsSync(filePath)) {
        return []
    }

    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    } catch (error) {
        console.error('Failed to parse shared mods.json:', error)
        return []
    }
}

function findModDefinition(mod) {
    const availableMods = loadAvailableMods()
    if (!mod) return null

    return availableMods.find((definition) => {
        return (
            (definition.github_api && mod.github_api && definition.github_api === mod.github_api) ||
            (definition.mod_name && mod.mod_name && definition.mod_name === mod.mod_name) ||
            (definition.github_url && mod.github_api && definition.github_url === mod.github_api)
        )
    })
}

async function launchEnabledMods(gameData) {
    if (!gameData || typeof gameData !== 'object') {
        console.warn('launchEnabledMods called without valid gameData, skipping mod launch')
        return
    }

    const seasonCode = typeof gameData.seasonCode === 'string' ? gameData.seasonCode : ''
    const savedMods = userData.getSetting('mods') || []
    const enabledMods = savedMods.filter((mod) => mod.filePath && mod.disabled !== true)

    const applicableMods = enabledMods.filter((mod) => {
        const definition = findModDefinition(mod)
        if (!definition || !Array.isArray(definition.season) || definition.season.length === 0) {
            return true
        }

        return definition.season.includes(seasonCode)
    })

    if (applicableMods.length === 0) {
        console.log('No enabled mods to launch for season', gameData.seasonCode)
        return
    }

    for (const mod of applicableMods) {
        try {
            const modPath = path.resolve(mod.filePath)
            if (!fs.existsSync(modPath)) {
                console.warn(`Enabled mod file not found: ${modPath}`)
                continue
            }

            const modExt = path.extname(modPath).toLowerCase()
            const isCommandScript = process.platform === 'win32' && (modExt === '.bat' || modExt === '.cmd')

            let spawnCommand = modPath
            let spawnArgs = []
            const spawnOptions = {
                windowsHide: true,
                cwd: path.dirname(modPath),
                stdio: 'ignore'
            }

            if (isCommandScript) {
                const defaultCmd = process.env.ComSpec || path.join(process.env.SystemRoot || 'C:\Windows', 'System32', 'cmd.exe')
                const cmdPath = fs.existsSync(defaultCmd) ? defaultCmd : 'cmd.exe'
                spawnCommand = cmdPath
                spawnArgs = ['/d', '/s', '/c', `"${modPath}"`]
            } else if (process.platform === 'win32') {
                spawnOptions.windowsVerbatimArguments = true
            }

            const modProc = spawn(spawnCommand, spawnArgs, spawnOptions)

            modProc.on('error', (error) => {
                if (error.code === 'EACCES' && process.platform === 'win32' && !isCommandScript) {
                    console.warn(`Permission denied launching mod directly, retrying with cmd.exe: ${modPath}`)
                    const defaultCmd = process.env.ComSpec || path.join(process.env.SystemRoot || 'C:\Windows', 'System32', 'cmd.exe')
                    const cmdPath = fs.existsSync(defaultCmd) ? defaultCmd : 'cmd.exe'
                    const retryArgs = ['/d', '/s', '/c', `"${modPath}"`]
                    try {
                        const retryProc = spawn(cmdPath, retryArgs, spawnOptions)
                        if (retryProc) {
                            currentModProcesses.push({ proc: retryProc, modPath })
                            retryProc.on('exit', () => {
                                currentModProcesses = currentModProcesses.filter((entry) => entry.proc.pid !== retryProc.pid)
                            })
                            console.log(`Launched mod process with fallback: ${mod.mod_name || mod.github_api} (${modPath})`)
                        }
                    } catch (retryError) {
                        console.error(`Fallback launch failed for mod ${mod.mod_name || mod.github_api}:`, retryError)
                    }
                } else {
                    console.error(`Failed to launch enabled mod ${mod.mod_name || mod.github_api}:`, error)
                }
            })

            if (modProc) {
                currentModProcesses.push({ proc: modProc, modPath })
                modProc.on('exit', () => {
                    currentModProcesses = currentModProcesses.filter((entry) => entry.proc.pid !== modProc.pid)
                })
                console.log(`Launched mod process: ${mod.mod_name || mod.github_api} (${modPath}) PID=${modProc.pid}`)
            }
        } catch (error) {
            console.error(`Failed to launch enabled mod ${mod.mod_name || mod.github_api}:`, error)
        }
    }
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
    if (!gameData || typeof gameData !== 'object') {
        throw new Error('launchGame requires valid gameData')
    }

    var args = [
        // "/belaunch -be",
        "/belaunch",
        "/nologo",
        gameData.suppArgs
    ]

    if (!gameData) {
        throw new Error('Missing gameData in launchGame')
    }

    if (!gameData.patched) {
        await patchGame(gameData)
    }

    restoreThrowbackSaves(gameData)

    await launchEnabledMods(gameData)

    // Update du pseudo dans le fichier de config
    const username = await userData.getSetting("username")
    await updateUsername(gameData.gameFolderPath, username)

    proc = spawn(gameData.exePath, args)
    currentGameProcess = proc
    currentGameData = gameData
    startTime = Date.now()
    callbacks.onSuccess?.(gameData.seasonCode)

    let gameCloseHandled = false
    const handleGameClose = (code, signal) => {
        console.log('Game Closed')
        if (gameCloseHandled) return
        gameCloseHandled = true
        console.log(`Game process terminated (code=${code}, signal=${signal})`)
        saveCurrentGameSaves()
        closeModProcesses()
        clearCurrentGameState()
        callbacks.onGameClosed?.()
    }

    proc.on('close', handleGameClose)
    proc.on('exit', handleGameClose)
    proc.on('error', (error) => {
        console.error('Game process error:', error)
    })

    if (!gameCloseMonitor) {
        gameCloseMonitor = setInterval(() => {
            if (!proc) {
                handleGameClose(null, 'monitor')
                return
            }

            if (proc.killed) {
                handleGameClose(null, 'monitor')
                return
            }

            try {
                process.kill(proc.pid, 0)
            } catch (err) {
                if (err.code === 'ESRCH') {
                    console.log('Monitor detected game process has exited')
                    handleGameClose(null, 'monitor')
                }
            }
        }, 1000)
    }
}

//
// =========================
// KILL GAME
// =========================
//
function killGame(callbacks = {}) {
    if (!currentGameProcess) {
        closeModProcesses()
        clearCurrentGameState()
        callbacks.onSuccess?.()
        return true
    }

    try {
        saveCurrentGameSaves()
        closeModProcesses()
        currentGameProcess.kill("SIGTERM")
        clearCurrentGameState()

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

        https.get(url, {
            headers: {
                'User-Agent': 'Siege-Launcher'
            }
        }, (response) => {
            if (response.statusCode !== 200) {
                file.close()
                fs.unlink(dest, () => { })
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

function getJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Siege-Launcher'
            }
        }, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                return resolve(getJson(response.headers.location))
            }

            let data = ''
            response.on('data', (chunk) => data += chunk)
            response.on('end', () => {
                try {
                    resolve(JSON.parse(data))
                } catch (error) {
                    reject(error)
                }
            })
        }).on('error', reject)
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

// DOWNLOAD MOD
async function downloadMod(apiUrl, modName) {
    if (!apiUrl) {
        throw new Error('No API URL provided for mod download')
    }

    const releaseData = await getJson(apiUrl)
    const asset = releaseData?.assets?.[0]

    if (!asset?.browser_download_url) {
        throw new Error('No downloadable asset found in the GitHub release')
    }

    const modsDir = getModsDir()

    const fileName = path.basename(asset.browser_download_url.split('?')[0])
    const destPath = path.join(modsDir, fileName)

    await downloadFile(asset.browser_download_url, destPath)

    const savedMods = userData.getSetting('mods') || []
    const existingIndex = savedMods.findIndex((mod) =>
        mod.github_api === apiUrl || mod.mod_name === modName
    )

    const updatedMod = {
        ...(existingIndex >= 0 ? savedMods[existingIndex] : {}),
        mod_name: modName || savedMods[existingIndex]?.mod_name || fileName,
        github_api: apiUrl,
        disabled: false,
        filePath: destPath,
        version: releaseData.tag_name || 'Downloaded'
    }

    const nextMods = [...savedMods]
    if (existingIndex >= 0) {
        nextMods[existingIndex] = updatedMod
    } else {
        nextMods.push(updatedMod)
    }

    userData.setSetting('mods', nextMods)

    return updatedMod
}

async function deleteMod(mod) {
    if (!mod) {
        throw new Error('No mod provided for deletion')
    }

    const savedMods = userData.getSetting('mods') || []
    const index = savedMods.findIndex((stored) =>
        stored.mod_name === mod.mod_name ||
        stored.github_api === mod.github_api ||
        (stored.filePath && mod.filePath && stored.filePath === mod.filePath)
    )

    if (index === -1) {
        return false
    }

    const [deletedMod] = savedMods.splice(index, 1)
    const filePath = deletedMod.filePath

    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath)
        } catch (error) {
            console.error('Failed to remove mod file:', error)
        }
    }

    userData.setSetting('mods', savedMods)
    return true
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
    updateGameArgs,
    downloadMod,
    deleteMod
}