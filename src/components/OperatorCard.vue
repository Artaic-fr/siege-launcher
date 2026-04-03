<script setup>
import { ref, onMounted } from 'vue'

const operatorDetails = ref({})

const props = defineProps({
    operatorData: {
        type: Object
    }
})

const emit = defineEmits(['close'])

const handleClose = () => {
    emit('close')
}

// Recupere une map aléatoire dans props.operatorData.maps pour l'afficher dans la page de détails de l'opérateur
const randomMap = () => {
    if (props.operatorData.maps && props.operatorData.maps.length > 0) {
        const randomIndex = Math.floor(Math.random() * props.operatorData.maps.length)
        return props.operatorData.maps[randomIndex].map_Img
    }
    return null
}

const backgroundMap = ref(randomMap())

onMounted(() => {
    window.api.getOperators(props.operatorData.operatorName).then((data) => {
        operatorDetails.value = data
    })
})
</script>

<template>

    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="handleClose">

        <div
            class="w-[75%] h-[75%] max-w-[1400px] max-h-[900px] flex relative bg-background-dark rounded-xl overflow-hidden shadow-2xl border border-white/5">

            <!-- Background effects -->
            <div class="absolute inset-0 pointer-events-none overflow-hidden">

                <!-- Subtle radial light -->
                <div
                    class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,_rgba(23,115,207,0.05),transparent)]">
                </div>

                <div class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent"></div>

            </div>


            <!-- Operator side -->
            <div class="relative w-[45%] h-full flex-shrink-0 overflow-hidden bg-[#034a82]">

                <!-- Map background -->
                <div class="absolute inset-0 bg-cover bg-center scale-110 blur-[2px] transition-transform duration-[4000ms]"
                    :style="{ backgroundImage: `url(${backgroundMap})` }">
                </div>

                <!-- Operator image -->
                <img :alt="props.operatorData.operatorName" :src="props.operatorData.operatorImage"
                    class="relative z-10 w-full h-full object-cover object-top pointer-events-none select-none" />

                <!-- Back button -->
                <div class="absolute top-0 left-0 p-6 z-20">
                    <button @click="handleClose"
                        class="bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10 hover:border-white/30 transition-colors">
                        <span class="material-symbols-outlined block">arrow_back_ios_new</span>
                    </button>
                </div>

            </div>


            <!-- Content -->
            <div class="flex-1 h-full flex flex-col p-6 overflow-y-auto custom-scrollbar relative z-10">

                <!-- Header -->
                <div class="mb-8 mt-4">

                    <div class="flex items-center gap-4 mb-2">

                        <div
                            class="w-16 h-16 bg-surface border border-primary/40 rounded p-2 flex items-center justify-center tactical-border">
                            <img :src="props.operatorData.opIcon" :alt="props.operatorData.operatorName + ' icon'"
                                class="w-full h-full object-contain filter brightness-110" />
                        </div>

                        <div>

                            <span class="text-primary text-[10px] font-black uppercase tracking-[0.3em]">
                                {{ operatorDetails.op_UAT }}
                            </span>

                            <h2 class="text-5xl font-black italic uppercase tracking-tighter leading-none mt-1">
                                {{ operatorDetails.op_Name }}
                            </h2>

                        </div>

                    </div>

                    <!-- Stats -->
                    <div class="flex gap-4 mt-4">

                        <!-- Armor -->
                        <div class="flex items-center gap-1">
                            <span class="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Armor</span>
                            <span v-for="i in 3" :key="i" class="w-2.5 h-1 rounded-sm"
                                :class="i <= operatorDetails.op_armor ? 'bg-primary' : 'bg-slate-700'"></span>
                        </div>

                        <!-- Speed -->
                        <div class="flex items-center gap-1">
                            <span class="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Speed</span>
                            <span v-for="i in 3" :key="i" class="w-2.5 h-1 rounded-sm"
                                :class="i <= operatorDetails.op_speed ? 'bg-primary' : 'bg-slate-700'"></span>
                        </div>

                    </div>

                </div>


                <!-- Sections -->
                <div class="space-y-8 flex-1">

                    <!-- Primary weapons -->
                    <section>

                        <h3
                            class="text-xs font-black italic text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-primary rotate-45"></span>
                            Primary Weapons
                        </h3>

                        <div class="grid grid-cols-2 gap-3">

                            <div v-for="(weapon, index) in operatorDetails.loadout?.primary_weapons" :key="index"
                                class="weapon-card">
                                <div class="flex justify-between items-start">
                                    <span class="text-[10px] font-bold text-slate-300 uppercase">
                                        {{ weapon.weapon_type }}
                                    </span>
                                </div>

                                <h4 class="text-sm font-black italic uppercase">
                                    {{ weapon.weapon_Name }}
                                </h4>

                                <div class="h-12 flex items-center justify-center py-1">
                                    <img v-if="weapon.weapon_Img" :src="weapon.weapon_Img" :alt="weapon.name"
                                        class="max-h-32 object-contain" />
                                    <div v-else class="w-24 h-6 bg-white/10 rounded-sm"></div>
                                </div>
                            </div>

                        </div>

                    </section>


                    <!-- Secondary weapons -->
                    <section>

                        <h3
                            class="text-xs font-black italic text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-primary rotate-45"></span>
                            Secondary Weapons
                        </h3>

                        <div class="grid grid-cols-2 gap-3">

                            <div v-for="(weapon, index) in operatorDetails.loadout?.secondary_weapons" :key="index"
                                class="weapon-card">
                                <div class="flex justify-between items-start">
                                    <span class="text-[10px] font-bold text-slate-300 uppercase">
                                        {{ weapon.weapon_type }}
                                    </span>
                                </div>

                                <h4 class="text-sm font-black italic uppercase">
                                    {{ weapon.weapon_Name }}
                                </h4>

                                <div class="h-12 flex items-center justify-center py-1">
                                    <img v-if="weapon.weapon_Img" :src="weapon.weapon_Img" :alt="weapon.name"
                                        class="max-h-32 object-contain" />
                                    <div v-else class="w-24 h-6 bg-white/10 rounded-sm"></div>
                                </div>
                            </div>

                        </div>

                    </section>


                    <!-- Gadgets -->
                    <section class="pb-8">

                        <h3
                            class="text-xs font-black italic text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-primary rotate-45"></span>
                            Gadgets
                        </h3>

                        <div class="grid grid-cols-2 gap-3">

                            <div v-for="(gadget, index) in operatorDetails.loadout?.gadgets" :key="index"
                                class="weapon-card flex flex-col items-center text-center">

                                <h4 class="text-sm font-black italic uppercase mb-2">
                                    {{ gadget.gadget_Name }}
                                </h4>

                                <div class="h-32 flex items-center justify-center w-full">
                                    <img v-if="gadget.gadget_Img" :src="gadget.gadget_Img" :alt="gadget.gadget_Name"
                                        class="max-h-32 object-contain" />

                                    <div v-else class="w-24 h-6 bg-white/10 rounded-sm"></div>
                                </div>

                            </div>

                        </div>

                    </section>

                </div>

            </div>

        </div>

    </div>

</template>