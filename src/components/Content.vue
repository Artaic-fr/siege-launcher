<script setup>
import { ref, onMounted, computed } from 'vue'
import FeaturedOperators from './FeaturedOperators.vue'
import OperatorCard from './OperatorCard.vue'
import SteamLoginModal from './SteamLoginModal.vue'
import GameSettings from './GameSettings.vue';
import DownloadModal from './DownloadModal.vue'
import { queue, currentJobId, progressPercent, currentDepotIndex, currentDepotTotal, currentDepotProgress, installedGames, Launched } from "../stores/downloadStore.js"


const SeasonContent = ref({})
const Attackers = ref([])
const Defenders = ref([])
var jobs = ref([])

const selectedOperator = ref(null)

const showSteamLoginModal = ref(false)
const showDownloadModal = ref(false)
const needSteamLogin = ref(false)
const showGameSettings = ref(false)
var GameSize = ref(0)

const isInstalled = computed(() => {
    return installedGames.value.some(
        game => game.seasonCode?.toLowerCase() === props.season.season_code?.toLowerCase()
    )
})

var isLaunched = computed(() => {
    return Launched.value?.toLowerCase() === props.season.season_code?.toLowerCase()
})

var installedGame = computed(() => {
    return installedGames.value.find(
        game => game.seasonCode === props.season.season_code
    )
})

const isDownloading = computed(() =>
    currentJobId.value === props.season.season_code
)

var isQueued = computed(() =>
    queue.value.some(job => job.SeasonCode === props.season.season_code)
)

const props = defineProps({
    season: {
        type: Object,
        required: true
    }
})

const handleOperatorSelect = (operatorData) => {
    selectedOperator.value = operatorData
}

const closeOperatorCard = () => {
    selectedOperator.value = null
}

onMounted(() => {
    window.api.getSeasons().then((data) => {
        SeasonContent.value = data.find(s => s.season_code === props.season.season_code)
        if (SeasonContent.value.featured_operators.length > 3) {
            Attackers.value = SeasonContent.value.featured_operators.filter(op => op.side === 'Attacker')
            Defenders.value = SeasonContent.value.featured_operators.filter(op => op.side === 'Defender')
        }
        GameSize.value = (SeasonContent.value.game_size / 1024 / 1024 / 1024).toFixed(2)
    })

    window.settings.get('installedGame').then((games) => {
        games.find(game => {
            if (game.code === props.season.season_code) {
                GameInstalled.value = true
            }
        })
    })
})

function clean(data) {
    return JSON.parse(JSON.stringify(data))
}

function SteamLoginModalClose() {
    showSteamLoginModal.value = false
    if (window.settings.get('steam.havebeenConnected')) {
        downloadGame()
    }
}

function openSteamLoginModal() {
    needSteamLogin.value = false
    showSteamLoginModal.value = true
}

function downloadGame() {
    window.settings.get('steam.havebeenConnected').then((connected) => {
        if (connected) {
            showDownloadModal.value = true
        } else {
            needSteamLogin.value = true
        }
    })
}

function closeDownloadModal() {
    showDownloadModal.value = false
}

function openGameModal() {
    showGameSettings.value = true
}

function closeGameModal() {
    showGameSettings.value = false
}

function launch() {
    if (Launched.value == null) {
        window.game.launch(clean(installedGame.value))
    } else {
        alert("Game is already launched")
    }
}

function closeGame() {
    window.game.close()
}

function cancelQueue() {
    if (!confirm("Are you sure you want to cancel the download?")) return
    window.queue.cancelJob(props.season.season_code)
}

</script>

<template>
    <div class="flex-1 flex flex-col dark:bg-background-dark overflow-hidden h-screen">
        <main v-if="!selectedOperator"
            class="flex-1 flex flex-col dark:bg-background-dark overflow-y-auto overflow-hidden h-screen custom-scrollbar">
            <section class="relative h-[40vh] md:h-[50vh] min-h-[300px] w-full shrink-0">
                <div class="absolute inset-0 bg-cover bg-center"
                    :style="{ backgroundImage: `url('${SeasonContent.season_bg}')` }">
                </div>
                <div
                    class="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/40 to-transparent">
                </div>
                <div class="absolute inset-0 bg-gradient-to-r from-background-dark/80 via-transparent to-transparent">
                </div>
                <div class="absolute bottom-0 left-0 p-6 md:p-12 max-w-2xl">

                    <h2 class="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase mb-2">
                        {{ SeasonContent.season_name }}</h2>
                    <p class="text-slate-300 text-sm md:text-lg max-w-md line-clamp-3">
                        {{ SeasonContent.season_description }}
                    </p>
                    <div class="mt-8 flex flex-wrap gap-4">

                        <button v-if="isDownloading"
                            class="group relative w-[300px] px-10 py-4 bg-[#1a232e] text-white font-black uppercase tracking-tighter rounded overflow-hidden cursor-default">

                            <!-- Hover effect désactivé visuellement -->
                            <div class="absolute inset-0 bg-white/5 opacity-0"></div>

                            <!-- Content -->
                            <div class="relative z-10 flex flex-col gap-2">

                                <!-- Ligne principale -->
                                <div class="flex items-center justify-between gap-2">

                                    <div class="flex flex-col gap-1">
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="w-4 h-4 border-2 border-white/30 border-t-primary rounded-full animate-spin">
                                            </div>
                                            <span>Downloading</span>
                                        </div>
                                        <div class="text-xs text-slate-200">
                                            Depot {{ currentDepotIndex || 1 }}/{{ currentDepotTotal || '...' }} ·
                                            {{ currentDepotProgress !== null ? Math.floor(currentDepotProgress) : 0 }}%
                                        </div>
                                    </div>

                                    <!-- % -->
                                    <span class="text-xs text-primary font-bold">
                                        {{ Math.floor(progressPercent) }}%
                                    </span>

                                </div>

                                <!-- Barre -->
                                <div class="w-full h-1 bg-white/10 rounded overflow-hidden">
                                    <div class="h-full bg-primary transition-all duration-300"
                                        :style="{ width: (progressPercent || 0) + '%' }">
                                    </div>
                                </div>
                            </div>
                        </button>

                        <button v-if="isQueued && !isDownloading" @click="cancelQueue"
                            class="group relative px-10 py-4 bg-[#1a232e] text-white font-black uppercase tracking-tighter rounded overflow-hidden cursor-default">
                            <!-- Hover effect désactivé visuellement -->
                            <div class="absolute inset-0 bg-white/5 opacity-0"></div>
                            <!-- Content -->
                            <div class="relative z-10 flex flex-col gap-2">
                                <!-- Ligne principale -->
                                <div class="flex items-center justify-between gap-2">
                                    <div class="flex items-center gap-2">
                                        <div
                                            class="w-4 h-4 border-2 border-white/30 border-t-primary rounded-full animate-spin">
                                        </div>
                                        <span>Waiting</span>
                                    </div>
                                </div>
                            </div>
                        </button>

                        <button v-if="!isInstalled && !isDownloading && !isQueued" @click="downloadGame"
                            class="group relative px-10 py-4 bg-primary text-white font-black uppercase tracking-tighter rounded overflow-hidden">
                            <div
                                class="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform">
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined fill-1">download</span>
                                <span>Install Game</span>
                            </div>
                        </button>
                        <button v-if="isInstalled && !isDownloading && !isQueued && !isLaunched" @click="launch"
                            class="group relative px-10 py-4 bg-primary text-white font-black uppercase tracking-tighter rounded overflow-hidden">
                            <div
                                class="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform">
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined fill-1">play_arrow</span>
                                <span>Launch Game</span>
                            </div>
                        </button>
                        <button v-if="isInstalled && isLaunched" @click="closeGame()"
                            class="group relative flex items-center gap-3 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wide rounded-lg overflow-hidden transition">
                            <!-- Effet hover -->
                            <div
                                class="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform">
                            </div>

                            <!-- Contenu -->
                            <div class="relative flex items-center gap-2">
                                <span class="material-symbols-outlined text-lg leading-none">
                                    stop
                                </span>
                                <span class="leading-none">
                                    Close Game
                                </span>
                            </div>
                        </button>
                        <button v-if="isInstalled && !isDownloading" @click="openGameModal"
                            class="px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-tighter rounded border border-white/10 flex items-center gap-2">
                            <span class="material-symbols-outlined text-xl">settings</span>
                            <span>Settings</span>
                        </button>

                    </div>
                </div>
            </section>
            <section class="p-6 md:p-12 space-y-12 bg-background-dark">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="space-y-4">
                        <h4 class="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">info</span>
                            Technical Info
                        </h4>
                        <div class="space-y-3">
                            <div class="flex justify-between items-center py-2 border-b border-white/5">
                                <span class="text-slate-400 text-sm">Release Date</span>
                                <span class="text-white text-sm font-medium">{{ SeasonContent.release_date }}</span>
                            </div>
                            <div v-if="SeasonContent.added_operators?.length > 0"
                                class="flex justify-between items-center py-2 border-b border-white/5">
                                <span class="text-slate-400 text-sm">Operators Added</span>
                                <span class="text-white text-sm font-medium">{{SeasonContent.added_operators.map(op =>
                                    op.op_Name).join(', ')}}</span>
                            </div>
                            <div v-if="SeasonContent.released_maps?.length > 0"
                                class="flex justify-between items-center py-2 border-b border-white/5 gap-5">
                                <span class="text-slate-400 text-sm">Maps Released</span>
                                <span class="text-white text-sm font-medium block text-right">{{
                                    SeasonContent.released_maps.map(map => map.map_Name).join(', ')}}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-white/5">
                                <span class="text-slate-400 text-sm">Install Size</span>
                                <span class="text-white text-sm font-medium">{{ GameSize }} GB</span>
                            </div>
                        </div>
                    </div>
                    <div v-if="SeasonContent.changes?.length > 0" class="md:col-span-2 space-y-4">
                        <h4 class="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">history_edu</span>
                            Patch Notes Highlights
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div
                                class="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-primary/50 transition-colors">
                                <h5 class="text-white font-bold text-sm mb-1 uppercase italic">V3.1 Balancing</h5>
                                <p class="text-slate-400 text-xs leading-relaxed">Ela's Scorpion EVO 3 A1 magazine size
                                    reduced. Deployable shield placement improvements.</p>
                            </div>
                            <div
                                class="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-primary/50 transition-colors">
                                <h5 class="text-white font-bold text-sm mb-1 uppercase italic">New Feature</h5>
                                <p class="text-slate-400 text-xs leading-relaxed">Introduction of the Advanced
                                    Deployment setting for gadgets and barricades.</p>
                            </div>
                            <div
                                class="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-primary/50 transition-colors">
                                <h5 class="text-white font-bold text-sm mb-1 uppercase italic">Outbreak Event</h5>
                                <p class="text-slate-400 text-xs leading-relaxed">Limited time 3-player co-op mission
                                    mode against mutated hostiles in New Mexico.</p>
                            </div>
                            <div
                                class="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-primary/50 transition-colors">
                                <h5 class="text-white font-bold text-sm mb-1 uppercase italic">Map Rework</h5>
                                <p class="text-slate-400 text-xs leading-relaxed">Y3S1 focuses on operator mechanics;
                                    Clubhouse rework scheduled for Mid-Season Reinforcements.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="space-y-4 pb-12">
                    <h4 class="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">groups</span>
                        Featured Operators
                    </h4>
                    <div v-if="SeasonContent?.featured_operators?.length > 3"
                        class="text-xl font-black italic uppercase text-white">Attackers</div>
                    <div v-if="SeasonContent?.featured_operators?.length > 3"
                        class="flex gap-4 overflow-x-auto pb-8 custom-scrollbar">
                        <FeaturedOperators v-for="(op, index) in Attackers" :key="index"
                            @operator-select="handleOperatorSelect" :operatorName="op.op_Name" :operatorSide="op.side"
                            :operatorImage="op.op_Img" :opIcon="op.op_Icon"
                            :enoughOP="SeasonContent?.featured_operators?.length <= 3"
                            :maps="SeasonContent.released_maps" />
                    </div>
                    <div v-if="SeasonContent?.featured_operators?.length > 3"
                        class="text-xl font-black italic uppercase text-white">Defenders</div>
                    <div v-if="SeasonContent?.featured_operators?.length > 3"
                        class="flex gap-4 overflow-x-auto pb-8 custom-scrollbar">
                        <FeaturedOperators v-for="(op, index) in Defenders" :key="index"
                            @operator-select="handleOperatorSelect" :operatorName="op.op_Name" :operatorSide="op.side"
                            :operatorImage="op.op_Img" :opIcon="op.op_Icon"
                            :enoughOP="SeasonContent?.featured_operators?.length <= 3"
                            :maps="SeasonContent.released_maps" />
                    </div>
                    <div v-if="SeasonContent?.featured_operators?.length <= 3"
                        class="flex gap-4 overflow-x-auto pb-8 custom-scrollbar">
                        <FeaturedOperators v-for="(op, index) in SeasonContent?.featured_operators" :key="index"
                            @operator-select="handleOperatorSelect" :operatorName="op.op_Name" :operatorSide="op.side"
                            :operatorImage="op.op_Img" :opIcon="op.op_Icon"
                            :enoughOP="SeasonContent?.featured_operators?.length <= 3"
                            :maps="SeasonContent.released_maps" />
                    </div>
                </div>

            </section>
        </main>

        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            v-if="needSteamLogin">

            <div
                class="bg-background-dark border border-white/10 w-full max-w-xl flex flex-col overflow-hidden rounded-lg shadow-2xl relative">

                <!-- Header -->
                <div class="p-6 border-b border-white/10">

                    <h2 class="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        <span class="w-2 h-6 bg-primary"></span>
                        Steam Login
                    </h2>
                </div>

                <!-- Content -->
                <div class="flex items-center justify-center flex-1">
                    <div class="w-full max-w-sm p-6 flex flex-col gap-4">
                        <p class="text-slate-300 text-md text-center">To download the game, please log in to your Steam
                            account.</p>
                        <button @click="openSteamLoginModal"
                            class="group relative px-10 py-4 bg-primary text-white font-black uppercase tracking-tighter rounded overflow-hidden">
                            <div
                                class="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform">
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined fill-1">login</span>
                                <span>Log in with Steam</span>
                            </div>
                        </button>
                    </div>
                </div>

            </div>

        </div>

        <OperatorCard v-if="selectedOperator" @close="closeOperatorCard" :operatorData="selectedOperator" />
        <SteamLoginModal v-if="showSteamLoginModal" @close="SteamLoginModalClose" />
        <DownloadModal v-if="showDownloadModal" @close="closeDownloadModal" :seasonCode="props.season.season_code" />
        <GameSettings v-if="showGameSettings" @close="closeGameModal" :settings="installedGame" />

    </div>
</template>