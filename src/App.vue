<script setup>
import { ref, onMounted } from 'vue'
import Content from './components/Content.vue'
import LeftSidebar from './components/LeftSidebar.vue';
import SteamLoginModal from './components/SteamLoginModal.vue'
import { initDownloadListeners, installedGames, Launched, queue, reconnectionRequired } from "./stores/downloadStore.js"

const selectedSeason = ref(null)
const selectedSeasonId = ref(null)
const showSteamModal = ref(false)

const handleSeasonSelect = (seasonData) => {
  selectedSeason.value = seasonData
  selectedSeasonId.value = seasonData.season_code
}

const handleCloseSteamModal = () => {
  showSteamModal.value = false
}

const handleLoginSuccess = async () => {
  // Le téléchargement reprendra automatiquement via resumeJobs() 
  // qui est appelée côté Electron après une connexion réussie
}

onMounted(async () => {
  initDownloadListeners()
  installedGames.value = await window.settings.getInstalled()
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
import { watch } from 'vue'
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
    <LeftSidebar @season-select="handleSeasonSelect" :selected-season-id="selectedSeasonId" />
    <Content v-if="selectedSeason" :season="selectedSeason" :key="selectedSeasonId" />
    <SteamLoginModal v-if="showSteamModal" @close="handleCloseSteamModal" @login-success="handleLoginSuccess" />
  </div>
</template>

<style scoped></style>
