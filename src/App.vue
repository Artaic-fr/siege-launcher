<script setup>
import { ref, onMounted, watch } from 'vue'
import Content from './components/Content.vue'
import LeftSidebar from './components/LeftSidebar.vue';
import SteamLoginModal from './components/SteamLoginModal.vue'
import NetCoreModal from './components/NetCoreModal.vue'
import { initDownloadListeners, installedGames, Launched, queue, reconnectionRequired } from "./stores/downloadStore.js"

const selectedSeason = ref(null)
const selectedSeasonId = ref(null)
const selectedSeasonEventIndex = ref(0)
const seasonEventIndexes = ref({})
const displayMode = ref('season')
const eventFilter = ref('all')
const installedFilter = ref('all')
const showSeasonContent = ref(false)
const showSteamModal = ref(false)
const showDownloadCloseConfirm = ref(false)

const getRandomEventIndex = (seasonData) => {
  const events = Array.isArray(seasonData?.event) ? seasonData.event : []
  if (events.length <= 1) return 0
  return Math.floor(Math.random() * events.length)
}

const getSeasonEventIndex = (seasonData) => {
  if (!seasonData?.season_code) return 0
  if (typeof seasonEventIndexes.value[seasonData.season_code] !== 'number') {
    seasonEventIndexes.value[seasonData.season_code] = 0
  }
  return seasonEventIndexes.value[seasonData.season_code]
}

const handleSeasonSelect = (seasonData) => {
  selectedSeason.value = seasonData
  selectedSeasonId.value = seasonData.season_code
  selectedSeasonEventIndex.value = getSeasonEventIndex(seasonData)
}

const handleUpdateDisplayMode = (value) => {
  displayMode.value = value
}

const handleUpdateEventFilter = (value) => {
  eventFilter.value = value
}

const handleUpdateInstalledFilter = (value) => {
  installedFilter.value = value
}

const handleCloseSteamModal = () => {
  showSteamModal.value = false
}

const handleConfirmCloseDownload = async () => {
  showDownloadCloseConfirm.value = false
  await window.api.confirmCloseDownload()
}

const handleKeepAppOpen = () => {
  showDownloadCloseConfirm.value = false
}

const handleUpdateShowSeasonContent = (value) => {
  showSeasonContent.value = value
}

const handleLoginSuccess = async () => {
  // Le téléchargement reprendra automatiquement via resumeJobs() 
  // qui est appelée côté Electron après une connexion réussie
}

const persistDisplayPreferences = async (updates = {}) => {
  const currentPreferences = await window.settings.get('preferences') || {}

  await window.settings.set('preferences', {
    ...currentPreferences,
    ...updates
  })
}

const loadDisplayPreferences = async () => {
  const savedPreferences = await window.settings.get('preferences') || {}

  const savedDisplayMode = savedPreferences.showEventAssets ? 'event' : 'season'
  const savedEventFilter = savedPreferences.filterSeasons || 'all'
  const savedInstalledFilter = savedPreferences.showGameInstalled ? 'installed' : 'all'

  displayMode.value = savedDisplayMode
  eventFilter.value = savedEventFilter
  installedFilter.value = savedInstalledFilter
  showSeasonContent.value = savedDisplayMode === 'event'
}

watch(displayMode, async (value) => {
  showSeasonContent.value = value === 'event'

  if (selectedSeason.value && Array.isArray(selectedSeason.value.event) && selectedSeason.value.event.length > 0) {
    const currentSeasonCode = selectedSeason.value.season_code

    if (value === 'event') {
      const chosenIndex = getRandomEventIndex(selectedSeason.value)
      seasonEventIndexes.value[currentSeasonCode] = chosenIndex
      selectedSeasonEventIndex.value = chosenIndex
    } else {
      seasonEventIndexes.value[currentSeasonCode] = 0
      selectedSeasonEventIndex.value = 0
    }
  }

  await persistDisplayPreferences({
    showEventAssets: value === 'event'
  })
})

watch(eventFilter, async (value) => {
  await persistDisplayPreferences({
    filterSeasons: value
  })
})

watch(installedFilter, async (value) => {
  await persistDisplayPreferences({
    showGameInstalled: value === 'installed'
  })
})

onMounted(async () => {
  initDownloadListeners()
  installedGames.value = await window.settings.getInstalled()
  await loadDisplayPreferences()

  window.api.onDownloadCloseRequest(() => {
    showDownloadCloseConfirm.value = true
  })
})

window.game.gameLaunched((data) => {
  Launched.value = data
})

window.game.gameClosed(() => {
  Launched.value = null
})

window.queue.onLog((log) => {
  console.log("Log from main process:", log)
  console.log("Current queue state:", queue.value)
})

window.steam.onLoginError((err) => {
  console.error("Steam login error:", err)
})

// Écouter les changements dans reconnectionRequired
watch(reconnectionRequired, (newVal) => {
  if (newVal) {
    console.log("Reconnection required, showing modal")
    showSteamModal.value = true
  } else {
    showSteamModal.value = false
  }
})
</script>

<template>
  <div
    class="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white">
    <LeftSidebar
      @season-select="handleSeasonSelect"
      :selected-season-id="selectedSeasonId"
      :selected-event-index="selectedSeasonEventIndex"
      :display-mode="displayMode"
      :event-filter="eventFilter"
      :installed-filter="installedFilter"
      @update:displayMode="handleUpdateDisplayMode"
      @update:eventFilter="handleUpdateEventFilter"
      @update:installedFilter="handleUpdateInstalledFilter"
      @update:showSeasonContent="handleUpdateShowSeasonContent"
    />
    <Content v-if="selectedSeason" :season="selectedSeason" :display-mode="displayMode" :show-season-content="showSeasonContent" :selected-event-index="selectedSeasonEventIndex" :key="selectedSeasonId" />
    <SteamLoginModal v-if="showSteamModal" @close="handleCloseSteamModal" @login-success="handleLoginSuccess" />
    <NetCoreModal />

    <div v-if="showDownloadCloseConfirm" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="handleKeepAppOpen">
      <div class="w-full max-w-md overflow-hidden rounded-lg border border-white/10 bg-background-dark shadow-2xl">
        <div class="border-b border-white/10 p-6">
          <h2 class="flex items-center gap-3 text-lg font-black uppercase italic tracking-tighter text-white">
            <span class="h-6 w-2 bg-primary"></span>
            Download in progress
          </h2>
        </div>

        <div class="space-y-5 p-6 text-sm text-slate-300">
          <p>
            A download is currently running. Closing the app will cancel it.
          </p>
          <p class="font-medium text-slate-200">
            Do you want to stop the download and close the application?
          </p>
        </div>

        <div class="flex justify-end gap-3 border-t border-white/10 bg-[#101827] p-4">
          <button
            class="rounded border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-200 transition hover:bg-white/10"
            @click="handleKeepAppOpen"
          >
            Keep app open
          </button>
          <button
            class="rounded bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-black transition hover:bg-primary/80"
            @click="handleConfirmCloseDownload"
          >
            Close anyway
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
