let store

const path = require("path")
const fs = require("fs")
const { shell, dialog } = require("electron")
const { exec } = require("child_process")

var electronApp = null

function getGamesDir() {
    const basePath = electronApp.getPath("userData")
    const gamesPath = path.join(basePath, "games")

    if (!fs.existsSync(gamesPath)) {
        fs.mkdirSync(gamesPath, { recursive: true })
    }

    return gamesPath
}

async function initStore(app) {

    electronApp = app

    const { default: Store } = await import("electron-store")

    const randomUsername = [
        "Recruit",
        "Operator",
        "Agent",
        "Specialist"
    ]

    store = new Store({
        defaults: {
            username: randomUsername[Math.floor(Math.random() * randomUsername.length)],
            steam: {
                havebeenConnected: false,
                lastUsername: ""
            },
            downloads: {
                maxParallel: 4,
                installPath: getGamesDir()
            },
            installedGame: []
            ,
            favoriteLanguage: "en"
        }
    })

}

function getSetting(key) {
    return store.get(key)
}

function setSetting(key, value) {
    store.set(key, value)
}

function homeDir() {
    if (!electronApp) {
        throw new Error("Electron app not initialized")
    }

    return path.dirname(electronApp.getPath("exe"))
}

function openAppDir() {
    shell.openPath(homeDir())
}

function selectGameDir() {
    const result = dialog.showOpenDialogSync({
        properties: ["openDirectory"]
    })
    if (result && result.length > 0) {
        return result[0]
    }
}

function pushSetting(path, datatoPush) {
    store.appendToArray(path, datatoPush)
}

function deleteSetting(key) {
    store.delete(key)
}

function getDiskSpace(targetPath) {
    return new Promise((resolve, reject) => {

        // récupère la lettre du disque (ex: C:)
        const drive = path.parse(targetPath).root.replace("\\", "")

        const command = `powershell -Command "Get-PSDrive -Name ${drive[0]} | Select-Object Used,Free"`

        exec(command, (error, stdout) => {
            if (error) return reject(error)

            const match = stdout.match(/(\d+)\s+(\d+)/)

            if (!match) return reject("Unable to parse disk info")

            const used = parseInt(match[1])
            const free = parseInt(match[2])
            const total = used + free

            resolve({
                free,
                used,
                total
            })
        })
    })
}

module.exports = {
    initStore,
    getSetting,
    setSetting,
    openAppDir,
    selectGameDir,
    homeDir,
    pushSetting,
    deleteSetting,
    getDiskSpace
}