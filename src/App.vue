<script setup>
import { ref, onMounted } from 'vue'
import Content from './components/Content.vue'
import LeftSidebar from './components/LeftSidebar.vue';
import { initDownloadListeners, installedGames, Launched } from "./stores/downloadStore.js"

const selectedSeason = ref(null)
const selectedSeasonId = ref(null)

const handleSeasonSelect = (seasonData) => {
  selectedSeason.value = seasonData
  selectedSeasonId.value = seasonData.season_code
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
</script>

<template>
  <div
    class="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white">
    <LeftSidebar @season-select="handleSeasonSelect" :selected-season-id="selectedSeasonId" />
    <Content v-if="selectedSeason" :season="selectedSeason" :key="selectedSeasonId" />
  </div>
</template>

<style scoped></style>
