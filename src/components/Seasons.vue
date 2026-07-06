<script setup>
const props = defineProps({
    season: {
        type: Object,
        required: true
    },
    displayMode: {
        type: String,
        default: 'season'
    },
    isSelected: Boolean,
})

const emit = defineEmits(['select'])

const handleClick = () => {
    emit('select', props.season)
}
</script>

<template>
    <div class="group cursor-pointer relative" @click="handleClick">
        <div v-if="props.isSelected" class="absolute -left-1 top-0 bottom-0 w-1 bg-primary rounded-full"></div>
        <div :class="['tactical-border bg-cover bg-center h-20 md:h-24 rounded-lg overflow-hidden border', props.isSelected ? 'border-primary/50' : 'border-white/5']"
            :style="{
                backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.2)), url(${props.displayMode === 'event' && Array.isArray(props.season.event) && props.season.event.length > 0 ? props.season.event[0].event_banner : props.season.season_banner})`
            }">
            <div class="p-3 flex flex-col h-full justify-center">
                <span v-if="props.isSelected" class="text-[10px] text-primary font-bold uppercase tracking-widest">Selected</span>
                <h3 class="font-bold text-sm md:text-base text-white uppercase">{{ props.season.season_name_short }}</h3>
                <p class="text-[10px] text-slate-400 uppercase">{{ props.season.season_code_full }}</p>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
