<script setup>
import { ref, computed, onMounted } from "vue"
import { initDownloadListeners, installedGames } from "../stores/downloadStore.js"

const props = defineProps({
    settings: {
        type: Object,
        required: true
    }
})

const emit = defineEmits('close')

const launchArgs = ref("")
const gamePath = ref("")

onMounted(() => {
    launchArgs.value = props.settings.suppArgs || ""
})

function openGameFolder() {
    window.game.openGameDir(props.settings.gameFolderPath)
}

function uninstallGame() {
    if (!confirm("Are you sure you want to uninstall?")) return
    closeModal()
    installedGames.value = installedGames.value.filter(
        game => game.gameFolderPath !== props.settings.gameFolderPath
    )
    window.game.uninstall(props.settings.gameFolderPath)
}

function saveSettings() {
    window.game.updateArgs(
        props.settings.seasonCode,
        launchArgs.value
    )
}

function closeModal() {
    emit("close")
}

</script>

<template>
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="closeModal">
        <div class="bg-slate-800 rounded-lg overflow-hidden w-full max-w-xl">

            <!-- HEADER -->
            <div class="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 class="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                    <span class="w-2 h-6 bg-primary"></span>
                    Game Settings
                </h2>

                <button @click="closeModal" class="text-slate-400 hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <!-- CONTENT -->
            <div class="p-6 space-y-6">

                <!-- GAME PATH -->
                <div class="p-4 bg-white/5 border border-white/10 rounded">
                    <label
                        class="block text-[10px] font-black uppercase tracking-widest text-primary mb-2 cursor-not-allowed">
                        Game Installation Path
                    </label>

                    <div class="flex items-center gap-2">
                        <input type="text" :value="props.settings.gameFolderPath" readonly
                            class="flex-1 bg-black/40 border border-white/5 text-slate-400 p-3 rounded text-sm outline-none" />

                        <button @click="openGameFolder"
                            class="size-11 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded transition">
                            <span class="material-symbols-outlined text-sm">folder_open</span>
                        </button>
                    </div>
                </div>

                <!-- LAUNCH ARGS -->
                <div class="p-4 bg-white/5 border border-white/10 rounded">
                    <label class="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                        Launch Arguments
                    </label>
                    <div class="flex items-center gap-2">
                        <input v-model="launchArgs" type="text" placeholder="-fullscreen"
                            class="w-full bg-[#1a232e] border border-white/10 text-white p-3 rounded text-sm focus:border-primary outline-none" />
                        <button @click="saveSettings"
                            class="size-11 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded transition">
                            <span class="material-symbols-outlined text-sm">save</span>
                        </button>
                    </div>

                    <p class="text-xs text-slate-500 mt-2">
                        Optional parameters passed to the game executable.
                    </p>
                </div>

            </div>

            <!-- FOOTER -->
            <div class="p-6 border-t border-white/10 flex justify-center items-center">
                <button @click="uninstallGame"
                    class="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-2 px-4 rounded text-sm transition">
                    Uninstall Game
                </button>
            </div>

        </div>
    </div>
</template>