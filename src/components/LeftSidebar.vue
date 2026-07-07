<script setup>
import { ref, onMounted, computed } from 'vue'
import Seasons from './Seasons.vue'
import Settings from './Settings.vue'
import FilterOptionsModal from './FilterOptionsModal.vue'

const seasons = ref([])
const props = defineProps({
    selectedSeasonId: String,
    displayMode: {
        type: String,
        default: 'season'
    },
    eventFilter: {
        type: String,
        default: 'all'
    }
})
const username = ref('')
const search = ref('')
const showSettings = ref(false)
const showFilterOptions = ref(false)

const emit = defineEmits(['season-select', 'update:displayMode', 'update:eventFilter', 'update:showSeasonContent'])

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

const setDisplayMode = (value) => {
    emit('update:displayMode', value)
}

const setEventFilter = (value) => {
    emit('update:eventFilter', value)
}

const setShowSeasonContent = (value) => {
    emit('update:showSeasonContent', value)
}

function openSettings() {
    showSettings.value = true
}

function oncloseSettings() {
    showSettings.value = false
    reloadUsername()
}

function openFilterOptions() {
    showFilterOptions.value = true
}

function closeFilterOptions() {
    showFilterOptions.value = false
}

function reloadUsername() {
    window.settings.get('username').then((data) => {
        username.value = data
    })
}

const filteredSeasons = computed(() => {
    const query = search.value.toLowerCase().trim().replace(/\s+/g, '')

    const matchesSearch = (season) => {
        if (!query) return true
        return (
            season.season_code?.toLowerCase().replace(/\s+/g, '').includes(query) ||
            season.season_code_full?.toLowerCase().replace(/\s+/g, '').includes(query) ||
            season.season_name_short?.toLowerCase().replace(/\s+/g, '').includes(query) ||
            season.season_name?.toString().replace(/\s+/g, '').includes(query) ||
            season.event?.some(event =>
                event.event_name
                    .toString()
                    .replace(/\s+/g, '')
                    .toLowerCase()
                    .includes(query.toLowerCase())
            ) ||
            season.featured_operators?.some(event =>
                event.op_Name
                    .toString()
                    .replace(/\s+/g, '')
                    .toLowerCase()
                    .includes(query.toLowerCase())
            )
        )
    }

    const matchesEventFilter = (season) => {
        const hasEvent = Array.isArray(season.event) && season.event.length > 0
        if (props.eventFilter === 'withEvent') return hasEvent
        if (props.eventFilter === 'withoutEvent') return !hasEvent
        return true
    }

    return seasons.value.filter((season) => matchesSearch(season) && matchesEventFilter(season))
})

</script>

<template>
    <Settings v-if="showSettings" @close="oncloseSettings" />
    <aside
        class="w-20 md:w-72 flex flex-col border-r border-white/10 bg-background-light dark:bg-[#0b1015] z-10 overflow-y-auto overflow-visible h-screen">
        <div class="p-4 flex items-center gap-3 border-b border-white/10">
            <div class="bg-primary p-1 rounded-lg shrink-0">
                <span class="material-symbols-outlined text-white text-2xl">shield_with_heart</span>
            </div>
            <h1 class="hidden md:block font-bold text-lg tracking-tight uppercase">Siege Launcher</h1>
        </div>
        <div class="p-3 md:p-4 border-b border-white/10">
            <div class="relative flex items-center gap-2">
                <div class="relative group flex-1">
                    <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <span
                            class="material-symbols-outlined text-slate-500 group-focus-within:text-primary transition-colors text-xl">search</span>
                    </div>
                    <input v-model="search"
                        class="w-full bg-[#1a232e] border border-white/10 text-white text-xs md:text-sm rounded-lg pl-10 pr-3 py-2.5 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-slate-500 placeholder:uppercase placeholder:font-bold placeholder:tracking-wider outline-none"
                        placeholder="Search..." type="text" />
                </div>
                <button
                    class="h-11 w-11 flex items-center justify-center rounded-lg bg-[#1a232e] border border-white/10 text-slate-300 hover:bg-white/10 transition"
                    @click="openFilterOptions" type="button" aria-label="Options d'affichage">
                    <span class="material-symbols-outlined text-xl">filter_list</span>
                </button>
                <FilterOptionsModal :show="showFilterOptions" :displayMode="props.displayMode"
                    :eventFilter="props.eventFilter" @close="closeFilterOptions" @update:displayMode="setDisplayMode"
                    @update:eventFilter="setEventFilter" @showSeasonContent="setShowSeasonContent" />
            </div>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4 space-y-3">
            <Seasons v-for="season in filteredSeasons" :key="season.season_code" :season="season"
                :display-mode="props.displayMode" :is-selected="selectedSeasonId === season.season_code"
                @select="handleSeasonSelect" />
        </div>
        <div class="p-4 border-t border-white/10 group cursor-pointer group-hover:bg-[#1a232e] transition-colors"
            @click="openSettings">
            <div class="flex items-center gap-3 rounded-lg">
                <div class="bg-[#1a232e] p-1 rounded-lg shrink-0 group-hover:bg-primary transition-colors">
                    <span class="material-symbols-outlined text-white text-2xl">settings</span>
                </div>
                <div
                    class="hidden md:block flex-1 overflow-hidden text-center rounded-lg bg-[#1a232e] p-2 text-xl group-hover:bg-primary transition-colors">
                    <p class="font-bold truncate">{{ username }}</p>
                </div>
            </div>
        </div>
    </aside>
</template>

<style></style>