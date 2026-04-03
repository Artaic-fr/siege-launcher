// stores/downloadStore.js
import { ref } from "vue"

export var queue = ref([])
export var currentJobId = ref(null)
export var progressPercent = ref(null)
export var installedGames = ref([])
export var Launched = ref(null)

const Y1R6 = ['Y1S0','Y1S1', 'Y1S2']

export function initDownloadListeners() {

    window.queue.init()

    window.queue.onQueueUpdated((q) => {
        queue.value = q
    })

    window.queue.onJobStarted(({ jobId }) => {
        currentJobId.value = jobId
    })

    window.queue.onJobCompleted(async (data) => {
        currentJobId.value = null
        progressPercent.value = null
        queue.value = queue.value.filter(j => j.id !== data.jobId)
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

    window.queue.onJobProgress(({ jobId, progress }) => {
        const job = queue.value.find(j => j.id === jobId)
        if (job) job.progress = progress
        progressPercent.value = progress
    })
}