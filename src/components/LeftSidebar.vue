<script setup>
import { ref, onMounted } from 'vue'
import Seasons from './Seasons.vue'
import Settings from './Settings.vue'

const seasons = ref([])
const props = defineProps({
    selectedSeasonId: String
})
const username = ref('')
const showSettings = ref(false)

const emit = defineEmits(['season-select'])

onMounted(() => {
    window.api.getSeasons().then((data) => {
        seasons.value = data
    })
    window.settings.get('username').then((data) => {
        username.value = data
    })

})

const handleSeasonSelect = (seasonData) => {
    emit('season-select', seasonData)
}

function openSettings() {
    showSettings.value = true
}

function oncloseSettings() {
    showSettings.value = false
    reloadUsername()
}

function reloadUsername() {
    window.settings.get('username').then((data) => {
        username.value = data
    })
}

</script>

<template>
    <Settings v-if="showSettings" @close="oncloseSettings" />
    <aside
        class="w-20 md:w-72 flex flex-col border-r border-white/10 bg-background-light dark:bg-[#0b1015] z-10 overflow-y-auto overflow-hidden h-screen">
        <div class="p-4 flex items-center gap-3 border-b border-white/10">
            <div class="bg-primary p-1 rounded-lg shrink-0">
                <span class="material-symbols-outlined text-white text-2xl">shield_with_heart</span>
            </div>
            <h1 class="hidden md:block font-bold text-lg tracking-tight uppercase">Siege Launcher</h1>
        </div>
        <div class="p-3 md:p-4 border-b border-white/10">
            <div class="relative group">
                <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <span
                        class="material-symbols-outlined text-slate-500 group-focus-within:text-primary transition-colors text-xl">search</span>
                </div>
                <input
                    class="w-full bg-[#1a232e] border border-white/10 text-white text-xs md:text-sm rounded-lg pl-10 pr-3 py-2.5 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-slate-500 placeholder:uppercase placeholder:font-bold placeholder:tracking-wider outline-none"
                    placeholder="Search versions (WIP)" type="text" />
            </div>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4 space-y-3">
            <Seasons v-for="season in seasons" :id="season.season_code" :name="season.season_name_short"
                :code="season.season_code_full" :url="season.season_banner"
                :is-selected="selectedSeasonId === season.season_code" @select="handleSeasonSelect" />
        </div>
        <div class="p-4 border-t border-white/10 group cursor-pointer group-hover:bg-[#1a232e] transition-colors" @click="openSettings">
            <div class="flex items-center gap-3 rounded-lg">
                <div class="bg-[#1a232e] p-1 rounded-lg shrink-0 group-hover:bg-primary transition-colors">
                    <span class="material-symbols-outlined text-white text-2xl">settings</span>
                </div>
                <div class="hidden md:block flex-1 overflow-hidden text-center rounded-lg bg-[#1a232e] p-2 text-xl group-hover:bg-primary transition-colors">
                    <p class="font-bold truncate">{{ username }}</p>
                </div>
            </div>
        </div>
    </aside>
</template>

<style></style>