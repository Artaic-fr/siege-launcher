<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
    eventData: {
        type: Array,
        required: true
    }
})

const emit = defineEmits('close')

var eventIndex = ref(0)

function closeEvent() {
    emit('close')
}

onMounted(() => {
    console.log(props?.eventData[eventIndex]?.media)
})

</script>

<template>
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="closeEvent">

        <div class="bg-slate-800 rounded-lg overflow-hidden w-full max-w-[60%] max-h-[90%] flex flex-col">
            <div class="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                <!-- Hero Banner Section -->
                <div v-if="props.eventData && props.eventData.length > 2">Ici des boutons</div>
                <div class="relative w-full h-[45vh] flex-shrink-0 overflow-hidden">
                    <img class="w-full h-full object-cover object-center scale-105"
                        :src="props?.eventData[eventIndex]?.event_bg" />
                    <div
                        class="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/20 to-transparent">
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent h-24"></div>
                    <div class="absolute top-0 left-0 p-6 w-full flex justify-between items-center">
                        <button class="bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10"
                            @click="closeEvent">
                            <span class="material-symbols-outlined block">arrow_back_ios_new</span>
                        </button>
                    </div>
                    <div class="absolute bottom-0 left-0 p-6 w-full">
                        <span class="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-1 block">Seasonal
                            Event</span>
                        <h1 class="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none mb-2">
                            {{ props?.eventData[eventIndex]?.event_name }}
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
                        <div>{{ props?.eventData[eventIndex]?.event_description }}</div>
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
                                <div class="text-2xl font-black italic">{{ props?.eventData[eventIndex]?.event_type }}
                                </div>
                                <div class="text-[8px] uppercase tracking-widest text-slate-500">Event type</div>
                            </div>
                            <div class="bg-surface/60 border border-white/10 rounded p-3 text-center">
                                <div class="text-2xl font-black italic">{{ props?.eventData[eventIndex]?.event_format }}
                                </div>
                                <div class="text-[8px] uppercase tracking-widest text-slate-500">Event format</div>
                            </div>
                            <div class="bg-surface/60 border border-white/10 rounded p-3 text-center">
                                <div class="text-2xl font-black italic">{{
                                    props?.eventData[eventIndex]?.event_opPlayable }}</div>
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
                            <div v-for="(media, index) in props?.eventData[eventIndex]?.media" :key="index"
                                class="aspect-video bg-surface rounded border border-white/5 overflow-hidden">

                                <iframe v-if="media.type === 'video'" :src="media.url" class="w-full h-full object-cover object-center scale-105 transition-transform duration-300"
                                    title="YouTube video player" frameborder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowfullscreen>
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