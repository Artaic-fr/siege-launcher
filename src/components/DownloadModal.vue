<script setup>
import { ref, onMounted, computed } from 'vue'

const emit = defineEmits('close')

const step = ref(1)
const isNextDisabled = computed(() => {
    if (step.value === 1) return !gameDir.value
    if (step.value === 2) return selectedLanguages.value.length === 0
    if (enoughSpace.value === false) return true
})

var enoughSpace = computed(() => {
    return parseFloat(spaceAvailable.value) >= parseFloat(requiredSpace.value) + parseFloat(requiredSpaceLanguage.value) + parseFloat(ultraSize.value) 
})

const gameDir = ref("")
const selectedLanguages = ref(['en'])
const languages = ref([])
const version = ref('')
var baseGameDepot = ref(null)
var UltraDepot = ref(null)
var seasonCode = ""
var spaceAvailable = ref(0)
var spaceUsed = ref(0)
var spaceUsedPercent = ref(0)
var spaceTotal = ref(0)
var requiredSpace = ref(0)
var requiredSpaceLanguage = ref(0)
var requiredSpaceUltra = ref(0)
var disk = ref("")
var ultraSize = ref(0)
var ultraEnabled = ref(false)

const props = defineProps({
    seasonCode: {
        type: String,
        required: true
    }
})

function handleNext() {
    if (step.value === 1) {
        step.value = 2
    } else {
        startDownload()
    }
}

function selectGameDir() {
    window.steam.chooseGameDir().then((dir) => {
        console.log("Selected directory: " + dir)
        if (dir) {
            gameDir.value = dir
            window.settings.getDiskSpace(gameDir.value).then((dir) => {
                spaceAvailable.value = (dir.free / 1024 / 1024 / 1024).toFixed(2)
                spaceUsed.value = (dir.used / 1024 / 1024 / 1024).toFixed(2)
                spaceTotal.value = (dir.total / 1024 / 1024 / 1024).toFixed(2)
                spaceUsedPercent.value = ((dir.used / dir.total) * 100).toFixed(1)
                disk.value = gameDir.value.slice(0, 2)
            })
        }
    })
}


onMounted(async () => {
    gameDir.value = await window.settings.get('downloads.installPath') || ""
    window.api.getSeasons().then((data) => {
        languages.value = data.find(s => s.season_code === props.seasonCode).languages
        version.value = data.find(s => s.season_code === props.seasonCode).season_name
        baseGameDepot.value = data.find(s => s.season_code === props.seasonCode).baseGame
        UltraDepot.value = data.find(s => s.season_code === props.seasonCode).highRes
        seasonCode = data.find(s => s.season_code === props.seasonCode).season_code
        requiredSpace.value = (data.find(s => s.season_code === props.seasonCode).game_size / 1024 / 1024 / 1024).toFixed(2)
        requiredSpaceUltra.value = (data.find(s => s.season_code === props.seasonCode).highRes.requiredSpace / 1024 / 1024 / 1024).toFixed(2)
    })
    window.settings.getDiskSpace(gameDir.value).then((space) => {
        spaceAvailable.value = (space.free / 1024 / 1024 / 1024).toFixed(2)
        spaceUsed.value = (space.used / 1024 / 1024 / 1024).toFixed(2)
        spaceTotal.value = (space.total / 1024 / 1024 / 1024).toFixed(2)
        spaceUsedPercent.value = ((space.used / space.total) * 100).toFixed(1)
        disk.value = gameDir.value.slice(0, 2)
    })
})

function closeSettings() {
    console.log("Lancement du téléchargement...")
    emit('close')
}

function clean(data) {
    return JSON.parse(JSON.stringify(data))
}

async function startDownload() {
    var depotToDownload = []
    depotToDownload = clean(baseGameDepot.value)
    var installedLanguages = []

    selectedLanguages.value.forEach(langCode => {
        if (langCode !== 'en') {
            const langDepot = languages.value.find(lang => lang.code === langCode)
            if (langDepot) {
                installedLanguages.push(langDepot)
            }
        }
    })

    if (ultraEnabled.value) {
        depotToDownload.push(UltraDepot.value)
    }

    const payload = {
        SeasonCode: seasonCode,
        depots: clean(depotToDownload), // [{id, manifest}]
        gamePath: gameDir.value,
        languages: clean(installedLanguages)
    }

    window.queue.addJob(payload)

    closeSettings()
}

function updatedLanguages() {
    var totalLangSize = 0
    selectedLanguages.value.forEach(langCode => {
        if (langCode !== 'en') {
            const langDepot = languages.value.find(lang => lang.code === langCode)
            if (langDepot) {
                totalLangSize += langDepot.langsize
            }
        }
    })
    requiredSpaceLanguage.value = (totalLangSize / 1024 / 1024 / 1024).toFixed(2)

    console.log("Total needed space : " + (parseFloat(requiredSpace.value) + parseFloat(requiredSpaceLanguage.value)).toFixed(2) + " GB")
    console.log("Enough space ? " + enoughSpace.value)
}

function updatedUltra() {
    if (requiredSpaceUltra.value > 0) {
        if (ultraSize.value === 0) {
            ultraSize.value = requiredSpaceUltra.value
        } else {
            ultraSize.value = 0
        }
    }
}

</script>

<template>
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="closeSettings">

        <div class="bg-slate-800 rounded-lg overflow-hidden w-full max-w-2xl flex flex-col">

            <!-- HEADER -->
            <div class="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 class="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                    <span class="w-2 h-6 bg-primary"></span>
                    Download {{ version }}
                </h2>

                <div class="flex items-center gap-4">

                    <span class="text-xs text-slate-400 font-bold">
                        Step {{ step }} / 2
                    </span>

                    <button class="text-slate-400 hover:text-white transition-colors item-center"
                        @click="closeSettings">
                        <span class="material-symbols-outlined">close</span>
                    </button>

                </div>

            </div>

            <!-- CONTENT -->
            <div class="p-6 flex-1">

                <!-- ========================= -->
                <!-- STEP 1 - INSTALL PATH -->
                <!-- ========================= -->
                <div v-if="step === 1" class="space-y-6">

                    <h3 class="text-lg font-bold">Choose installation directory</h3>

                    <div class="flex items-center gap-2">
                        <input
                            class="flex-1 bg-[#1a232e] border border-white/10 text-white p-3 rounded text-sm focus:border-primary outline-none"
                            type="text" :value="gameDir" readonly />

                        <button
                            class="px-6 h-11 bg-primary text-black font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-primary/80 transition"
                            @click="selectGameDir">
                            <span class="material-symbols-outlined text-sm">folder_open</span>
                            Browse
                        </button>
                    </div>

                    <p class="text-xs text-slate-400">
                        Select where the game will be installed.
                    </p>
                    <div class="bg-white/5 border border-white/10 p-4 rounded space-y-2">
                        <h4 class="text-xl font-bold">{{ disk }} Disk Space<span
                                class="material-symbols-outlined text-sm">hard_disk</span></h4>
                        <p class="text-xs text-slate-400">
                            {{ spaceAvailable }} GB free on {{ spaceTotal }} GB total ({{ spaceUsedPercent }} %)
                            <br>
                            Required space: {{ requiredSpace }} GB
                        </p>
                    </div>

                </div>

                <!-- ========================= -->
                <!-- STEP 2 - LANGUAGES -->
                <!-- ========================= -->
                <div v-if="step === 2" class="space-y-6">

                    <h3 class="text-lg font-bold">Select languages</h3>

                    <div class="grid grid-cols-2 gap-3">
                        <label
                            class="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded opacity-70 cursor-not-allowed">

                            <input type="checkbox" value="en" v-model="selectedLanguages" checked disabled
                                class="accent-primary cursor-not-allowed" />

                            <span class="text-sm font-bold">
                                English
                            </span>

                        </label>

                        <label v-for="lang in languages" :key="lang.code" @change="updatedLanguages()"
                            class="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded cursor-pointer hover:border-primary transition">
                            <input type="checkbox" :value="lang.code" v-model="selectedLanguages"
                                class="accent-primary" />

                            <span class="text-sm font-bold">
                                {{ lang.lang }}
                                <span class="text-xs text-slate-400">
                                    + {{ (lang.langsize / 1024 / 1024 / 1024).toFixed(2) }} GB
                                </span>
                            </span>
                        </label>

                    </div>

                    <p class="text-xs text-slate-400">
                        You can select multiple languages. English is installed by default.
                    </p>

                    <label @change="updatedUltra()"
                            class="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded cursor-pointer hover:border-primary transition">
                            <input type="checkbox" v-model="ultraEnabled"
                                class="accent-primary" /> Install 4K texture pack
                                <span class="text-xs text-slate-400">
                                    + {{ requiredSpaceUltra }} GB
                                </span>
                        </label>

                </div>

            </div>

            <!-- FOOTER -->
            <div class="p-6 border-t border-white/10 flex justify-between items-center">

                <!-- BACK -->
                <button v-if="step > 1" @click="step--"
                    class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition">
                    Back
                </button>

                <div v-else></div>

                <!-- NEXT / DOWNLOAD -->
                <p v-if="!enoughSpace" class="mt-2 text-sm text-red-400">
                    Insufficient disk space. You need at least {{ (parseFloat(requiredSpace) +
                        parseFloat(requiredSpaceLanguage)).toFixed(2) }} GB free to download and install the game with the
                    selected assets.
                </p>
                <button @click="handleNext" :disabled="isNextDisabled || !enoughSpace" :class="[
                    'px-6 py-3 font-bold uppercase text-sm rounded transition flex items-center gap-2 border',
                    (!enoughSpace)
                        ? 'bg-red-500/10 text-red-400 border-red-500 cursor-not-allowed'
                        : isNextDisabled
                            ? 'bg-slate-600 text-slate-400 border-transparent cursor-not-allowed'
                            : 'bg-primary text-black border-transparent hover:bg-primary/80'
                ]">
                    <span v-if="step === 1">Next</span>
                    <span v-else>Download</span>

                    <span class="material-symbols-outlined text-sm">
                        {{ step === 1 ? 'arrow_forward' : 'download' }}
                    </span>
                </button>
            </div>

        </div>

    </div>
</template>