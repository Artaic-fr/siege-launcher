<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
    eventData: {
        type: Array,
        required: true
    },
    initialEventIndex: {
        type: Number,
        default: 0
    }
})

const emit = defineEmits('close')

const eventIndex = ref(props.initialEventIndex || 0)
const currentEvent = computed(() => props.eventData?.[eventIndex.value] || null)

function closeEvent() {
    emit('close')
}

function selectEvent(index) {
    eventIndex.value = index
}

onMounted(() => {
    if (props.initialEventIndex >= 0 && props.initialEventIndex < props.eventData.length) {
        eventIndex.value = props.initialEventIndex
    }
    console.log(currentEvent.value?.media)
})

</script>

<template>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; frame-src https://www.youtube.com;">

    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="closeEvent">

        <div class="bg-slate-800 rounded-lg overflow-hidden w-full max-w-[60%] max-h-[90%] flex flex-col">
            <div class="sticky top-0 z-20 border-b border-white/10 bg-slate-800/90 backdrop-blur-md">
                <div class="flex items-center gap-3 p-3">
                    <button class="bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10 shrink-0"
                        @click="closeEvent" aria-label="Retour">
                        <span class="material-symbols-outlined block">arrow_back_ios_new</span>
                    </button>

                    <div v-if="props.eventData?.length > 1" class="flex-1 overflow-x-auto custom-scrollbar">
                        <div class="flex min-w-max items-center gap-2">
                            <button v-for="(event, index) in props.eventData" :key="event.event_name || index"
                                type="button"
                                @click="selectEvent(index)"
                                :class="[
                                    'whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-colors',
                                    index === eventIndex
                                        ? 'border-primary bg-primary/15 text-primary'
                                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                                ]">
                                {{ event.event_name }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                <div class="relative w-full h-[45vh] flex-shrink-0 overflow-hidden">
                    <img class="w-full h-full object-cover object-center scale-105"
                        :src="currentEvent?.event_bg" />
                    <div
                        class="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/20 to-transparent">
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent h-24"></div>
                    <div class="absolute bottom-0 left-0 p-6 w-full">
                        <span class="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-1 block">Seasonal
                            Event</span>
                        <h1 class="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none mb-2">
                            {{ currentEvent?.event_name }}
                        </h1>
                    </div>
                </div>

                <div class="p-6 space-y-8">
                    <section>
                        <h3
                            class="text-xs font-black italic text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-primary rotate-45"></span>
                            Event description
                        </h3>
                        <div>{{ currentEvent?.event_description }}</div>
                    </section>
                </div>

                <!-- Content Body -->
                <div class="p-6 space-y-8">
                    <section>
                        <h3
                            class="text-xs font-black italic text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-primary rotate-45"></span>
                            Event informations
                        </h3>
                        <div class="grid grid-cols-3 gap-2">
                            <div class="bg-surface/60 border border-white/10 rounded p-3 text-center tactical-border">
                                <div class="text-2xl font-black italic">{{ currentEvent?.event_type }}
                                </div>
                                <div class="text-[8px] uppercase tracking-widest text-slate-500">Event type</div>
                            </div>
                            <div class="bg-surface/60 border border-white/10 rounded p-3 text-center">
                                <div class="text-2xl font-black italic">{{ currentEvent?.event_format }}
                                </div>
                                <div class="text-[8px] uppercase tracking-widest text-slate-500">Event format</div>
                            </div>
                            <div class="bg-surface/60 border border-white/10 rounded p-3 text-center">
                                <div class="text-2xl font-black italic">{{
                                    currentEvent?.event_opPlayable }}</div>
                                <div class="text-[8px] uppercase tracking-widest text-slate-500">Playable operators
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3
                            class="text-xs font-black italic text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-primary rotate-45"></span>
                            Event Media
                        </h3>
                        <div class="grid grid-cols-2 gap-3">
                            <div v-for="(media, index) in currentEvent?.media || []" :key="index"
                                class="aspect-video bg-surface rounded border border-white/5 overflow-hidden">

                                <iframe v-if="media.type === 'video'" :src="media.url + '&origin=http://artaic.fr'"
                                    class="w-full h-full object-cover object-center scale-105 transition-transform duration-300"
                                    title="YouTube video player" frameborder="0"
                                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                                    referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
                                </iframe>

                                <img v-else-if="media.type === 'image'" :src="media.url"
                                    class="w-full h-full object-cover opacity-60" :alt="'Media ' + (index + 1)" />

                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </div>
</template>