<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    show: Boolean,
    displayMode: {
        type: String,
        default: 'season'
    },
    eventFilter: {
        type: String,
        default: 'all'
    }
})

const emit = defineEmits(['close', 'update:displayMode', 'update:eventFilter', 'showSeasonContent'])

const handleClose = () => emit('close')
const setDisplayMode = (mode) => {
    emit('update:displayMode', mode)
    if (mode === 'season') {
        emit('showSeasonContent', false)
    } else if (mode === 'event') {
        emit('showSeasonContent', true)
    }
}

const selectedEventFilter = ref(props.eventFilter)

watch(
    () => props.eventFilter,
    (value) => {
        if (value !== selectedEventFilter.value) {
            selectedEventFilter.value = value
        }
    }
)

watch(
    selectedEventFilter,
    (value) => {
        if (value !== props.eventFilter) {
            emit('update:eventFilter', value)
        }
    }
)
</script>

<template>
    <div v-if="show" class="absolute right-0 top-full mt-2 z-30 w-full max-w-sm">
        <div class="bg-slate-900 border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-sm">
            <div class="flex items-start justify-between gap-4 mb-5">
                <div>
                    <h2 class="text-lg font-black uppercase tracking-tight text-white">DISPLAY SETTINGS</h2>
                </div>
                <button @click="handleClose" class="text-slate-400 hover:text-white transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="space-y-6">
                <div class="p-4 bg-white/5 border border-white/10 rounded-lg">
                    <h3 class="text-sm font-bold uppercase tracking-[0.2em] mb-3 text-slate-200">Displayed assets</h3>
                    <div class="grid grid-cols-2 gap-3">
                        <button type="button"
                            class="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold uppercase transition-all"
                            :class="props.displayMode === 'season' ? 'bg-primary text-black' : 'bg-white/5 text-slate-300 hover:bg-white/10'"
                            @click="setDisplayMode('season')">
                            Seasonal assets
                        </button>

                        <button type="button"
                            class="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold uppercase transition-all"
                            :class="props.displayMode === 'event' ? 'bg-primary text-black' : 'bg-white/5 text-slate-300 hover:bg-white/10'"
                            @click="setDisplayMode('event')">
                            Event assets
                        </button>
                    </div>
                </div>

                <div class="p-4 bg-white/5 border border-white/10 rounded-lg">
                    <h3 class="text-sm font-bold uppercase tracking-[0.2em] mb-3 text-slate-200">Filter seasons</h3>
                    <div class="space-y-3">
                        <label
                            class="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-slate-950/20 cursor-pointer hover:bg-white/5 transition">
                            <input type="radio" name="event-filter" value="all" v-model="selectedEventFilter"
                                class="accent-primary" />
                            <span class="text-sm text-slate-200">All seasons</span>
                        </label>
                        <label
                            class="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-slate-950/20 cursor-pointer hover:bg-white/5 transition">
                            <input type="radio" name="event-filter" value="withEvent" v-model="selectedEventFilter"
                                class="accent-primary" />
                            <span class="text-sm text-slate-200">Seasons with events</span>
                        </label>
                        <label
                            class="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-slate-950/20 cursor-pointer hover:bg-white/5 transition">
                            <input type="radio" name="event-filter" value="withoutEvent" v-model="selectedEventFilter"
                                class="accent-primary" />
                            <span class="text-sm text-slate-200">Seasons without events</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
