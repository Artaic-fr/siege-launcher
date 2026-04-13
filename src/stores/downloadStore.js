// stores/downloadStore.js
import { ref } from "vue"

export var queue = ref([])
export var currentJobId = ref(null)
export var progressPercent = ref(null)
export var currentDepotIndex = ref(null)
export var currentDepotTotal = ref(null)
export var currentDepotProgress = ref(null)
export var installedGames = ref([])
export var Launched = ref(null)
export var reconnectionRequired = ref(false)
export var reconnectionJobId = ref(null)

const Y1R6 = ['Y1S0','Y1S1', 'Y1S2']

export function initDownloadListeners() {

    window.queue.init()

    window.queue.onQueueUpdated((q) => {
        queue.value = q
    })

    window.queue.onJobStarted(({ jobId }) => {
        currentJobId.value = jobId
        currentDepotIndex.value = null
        currentDepotTotal.value = null
        currentDepotProgress.value = null
    })

    window.queue.onDepotStarted(({ jobId, index, total }) => {
        if (currentJobId.value === jobId) {
            currentDepotIndex.value = index + 1
            currentDepotTotal.value = total
            currentDepotProgress.value = 0
        }
    })

    window.queue.onJobCompleted(async (data) => {
        currentJobId.value = null
        progressPercent.value = null
        currentDepotIndex.value = null
        currentDepotTotal.value = null
        currentDepotProgress.value = null
        reconnectionRequired.value = false
        reconnectionJobId.value = null
        queue.value = queue.value.filter(j => j.id !== data.seasonCode)
        var exePath = ''

        console.log("Season downloaded:", data.seasonCode)

        if(data.seasonCode && Y1R6.includes(data.seasonCode)) {
            exePath = data.gamePath + "\\RainbowSix.exe"
        } else {
            exePath = data.gamePath + "\\RainbowSixGame.exe"
        }

        const gameData = {
            seasonCode: data.seasonCode,
            gameFolderPath: data.gamePath,
            installedLanguages: data.installedLanguages,
            exePath: exePath,
            suppArgs: "",
            patched: false
        }
        await window.settings.add(gameData)

        installedGames.value.push(gameData)
    })

    window.queue.onJobProgress(({ jobId, progress, depotProgress }) => {
        const job = queue.value.find(j => j.id === jobId)
        if (job) job.progress = progress
        if (currentJobId.value === jobId) {
            progressPercent.value = progress
            if (typeof depotProgress === 'number') {
                currentDepotProgress.value = depotProgress
            }
        }
    })

    window.queue.onReconnectionRequired(({ jobId }) => {
        reconnectionRequired.value = true
        reconnectionJobId.value = jobId
    })
}