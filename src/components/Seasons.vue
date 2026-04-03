<script setup>
const props = defineProps({
    id: String,
    name: String,
    code: String,
    url: String,
    isSelected: Boolean,
})

const emit = defineEmits(['select'])

const handleClick = () => {
    emit('select', {
        season_code: props.id,
        season_name_short: props.name,
        season_code_full: props.code,
        season_banner: props.url
    })
}
</script>

<template>
    <div class="group cursor-pointer relative" @click="handleClick">
        <div v-if="isSelected" class="absolute -left-1 top-0 bottom-0 w-1 bg-primary rounded-full"></div>
        <div :class="['tactical-border bg-cover bg-center h-20 md:h-24 rounded-lg overflow-hidden border', isSelected ? 'border-primary/50' : 'border-white/5']"
            :style="{
                backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.2)), url(${url})`
            }">
            <div class="p-3 flex flex-col h-full justify-center">
                <span v-if="isSelected" class="text-[10px] text-primary font-bold uppercase tracking-widest">Selected</span>
                <h3 class="font-bold text-sm md:text-base text-white uppercase">{{ name }}</h3>
                <p class="text-[10px] text-slate-400 uppercase">{{ code }}</p>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
