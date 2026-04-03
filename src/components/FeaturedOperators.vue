<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
    operatorName: String,
    operatorSide: String,
    operatorImage: String,
    opIcon: String,
    enoughOP: Boolean,
    maps: Array
})

const emit = defineEmits(['operator-select'])

const handleCardClick = () => {
    emit('operator-select', {
        operatorName: props.operatorName,
        operatorSide: props.operatorSide,
        operatorImage: props.operatorImage,
        opIcon: props.opIcon,
        maps: props.maps
    })
}

</script>

<template>
    <div
        @click="handleCardClick"
        class="min-w-[200px] max-w-[300px] max-h-150 aspect-[4/5] bg-slate-800 rounded-lg overflow-hidden relative cursor-pointer border border-white/5 transform-gpu will-change-transform before:absolute before:inset-0 before:bg-gradient-to-t before:from-black before:to-transparent before:opacity-80 hover:border-primary/50 transition-colors">

        <img :src="props.operatorImage" :alt="props.operatorName" decoding="async"
            class="w-full h-full object-cover object-top pointer-events-none select-none" />

        <div class="absolute bottom-3 left-3 right-3">

            <div class="flex items-center gap-3">

                <!-- Icône opérateur -->
                <div class="flex items-center justify-center shrink-0">
                    <img v-if="props.opIcon" :src="props.opIcon" :alt="props.operatorName + ' icon'"
                        class="w-12 h-12 object-contain" decoding="async" />
                </div>

                <!-- Nom + Side -->
                <div class="flex flex-col leading-tight">
                    <p class="text-lg font-black italic uppercase text-white">
                        {{ props.operatorName }}
                    </p>

                    <p v-if="props.enoughOP" class="text-xs font-bold text-primary uppercase tracking-wide">
                        {{ props.operatorSide }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>