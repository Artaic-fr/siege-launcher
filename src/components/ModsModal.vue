<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
    mods: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits('close')
const localMods = ref([])

const safeMods = computed(() => {
    return Array.isArray(props.mods) ? props.mods : []
})

const storedModsByKey = computed(() => {
    return Array.isArray(localMods.value)
        ? localMods.value.reduce((map, installed) => {
              if (installed?.mod_name) {
                  map[installed.mod_name] = installed
              }
              if (installed?.github_api) {
                  map[installed.github_api] = installed
              }
              return map
          }, {})
        : {}
})

const getStoredMod = (mod) => {
    if (!mod) return null
    return storedModsByKey.value[mod.mod_name] || storedModsByKey.value[mod.github_api] || null
}

const isModInstalled = (mod) => {
    return !!getStoredMod(mod)
}

const isModDisabled = (mod) => {
    return getStoredMod(mod)?.disabled === true
}

const getStoredModVersion = (mod) => {
    return getStoredMod(mod)?.version || mod.version || ''
}

const getModStateLabel = (mod) => {
    const stored = getStoredMod(mod)
    if (!stored) {
        return mod.installed ? 'Installed' : 'Not installed'
    }
    return stored.disabled ? 'Disabled' : 'Enabled'
}

function closeModsModal() {
    emit('close')
}

async function syncModsFromStore() {
    const storedMods = await window.settings?.get?.('mods')
    localMods.value = Array.isArray(storedMods) ? storedMods : []
}

onMounted(async () => {
    await syncModsFromStore()
})

async function DownloadMod(apiUrl, modName) {
    try {
        const result = await window.game.downloadMod(apiUrl, modName)
        if (result) {
            const updatedMods = Array.isArray(localMods.value) ? [...localMods.value] : []
            const existingIndex = updatedMods.findIndex((mod) =>
                mod.github_api === apiUrl || mod.mod_name === modName
            )

            const downloadedMod = {
                ...result,
                mod_name: modName || result.mod_name || '',
                github_api: apiUrl,
                installed: true,
                disabled: false
            }

            if (existingIndex >= 0) {
                updatedMods[existingIndex] = {
                    ...updatedMods[existingIndex],
                    ...downloadedMod
                }
            } else {
                updatedMods.push(downloadedMod)
            }

            localMods.value = updatedMods
            await window.settings.set('mods', updatedMods)
        }
    } catch (error) {
        alert(`Download failed: ${error?.message || error}`)
    }
}

async function disableMod(mod) {
    const updatedMods = localMods.value.map((stored) =>
        stored.mod_name === mod.mod_name || stored.github_api === mod.github_api
            ? { ...stored, disabled: true }
            : stored
    )
    localMods.value = updatedMods
    await window.settings.set('mods', updatedMods)
}

async function enableMod(mod) {
    const updatedMods = localMods.value.map((stored) =>
        stored.mod_name === mod.mod_name || stored.github_api === mod.github_api
            ? { ...stored, disabled: false }
            : stored
    )
    localMods.value = updatedMods
    await window.settings.set('mods', updatedMods)
}

async function deleteMod(mod) {
    const storedMod = getStoredMod(mod) || mod
    const modToDelete = {
        mod_name: storedMod.mod_name,
        github_api: storedMod.github_api,
        filePath: storedMod.filePath
    }

    const isDeleted = await window.game.deleteMod(modToDelete)
    if (!isDeleted) {
        alert('Impossible de supprimer ce mod.')
        return
    }

    localMods.value = localMods.value.filter((stored) =>
        stored.mod_name !== storedMod.mod_name && stored.github_api !== storedMod.github_api
    )
}

</script>

<template>
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="closeModsModal">

        <div class="bg-slate-800 rounded-lg overflow-hidden w-full max-w-6xl max-h-[75vh] flex flex-col">

            <!-- Header -->
            <div class="p-6 border-b border-white/10 flex items-center justify-between">

                <h2 class="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                    <span class="w-2 h-6 bg-primary"></span>
                    Mods
                </h2>

                <button class="text-slate-400 hover:text-white transition" @click="closeModsModal">

                    <span class="material-symbols-outlined">
                        close
                    </span>

                </button>

            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto custom-scrollbar p-6">

                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">

                    <!-- Une carte -->
                    <div v-for="mod in safeMods" :key="mod.mod_name"
                        class="bg-white/5 border border-white/10 rounded-lg p-6 flex flex-col justify-between hover:border-primary transition">

                        <div>

                            <div class="flex justify-between items-start mb-6">

                                <div class="bg-primary/15 rounded-lg p-3">

                                    <span
                                        class="material-symbols-outlined text-primary text-4xl max-w-[50px] max-h-[50px] overflow-hidden align-middle">
                                        <img :src="mod.mod_thumbnail" :alt="mod.mod_name" />
                                    </span>

                                </div>

                                <div class="text-right">
                                    <div class="text-xs font-bold uppercase tracking-wider"
                                        :class="isModInstalled(mod) ? 'text-green-400' : 'text-slate-400'">
                                        {{ getStoredModVersion(mod) || '' }}
                                    </div>
                                    <div class="text-[10px] font-bold uppercase tracking-widest mt-1"
                                        :class="isModDisabled(mod) ? 'text-red-400' : 'text-emerald-400'">
                                        {{ getModStateLabel(mod) }}
                                    </div>
                                </div>

                            </div>

                            <h3 class="text-2xl font-black italic uppercase tracking-tight mb-3">
                                {{ mod.mod_name }}
                            </h3>

                            <p class="text-sm text-slate-400 leading-relaxed mb-6">
                                {{ mod.description }}
                            </p>

                        </div>

                        <div class="flex gap-2">

                            <button v-if="!isModInstalled(mod)"
                                @click="DownloadMod(mod.github_api, mod.mod_name)" :id="mod.mod_name"
                                class="flex-1 px-6 py-3 bg-primary rounded text-white font-bold uppercase text-xs tracking-widest hover:brightness-110 transition">

                                <span class="material-symbols-outlined mr-2 text-base align-middle">
                                    download
                                </span>
                                Download
                            </button>

                            <template v-else>
                                <button v-if="!isModDisabled(mod)" @click="disableMod(mod)"
                                    class="flex-1 px-6 py-3 bg-red-500 rounded text-white font-bold uppercase text-xs tracking-widest hover:brightness-110 transition">
                                    Disable
                                </button>

                                <button v-if="isModDisabled(mod)" @click="enableMod(mod)"
                                    class="flex-1 px-6 py-3 bg-green-500 rounded text-white font-bold uppercase text-xs tracking-widest hover:brightness-110 transition">
                                    Enable
                                </button>

                                <button
                                    @click="deleteMod(mod)"
                                    class="px-4 py-3 border border-red-500/30 rounded text-red-400 hover:bg-red-500/10 transition">
                                    <span class="material-symbols-outlined">
                                        delete
                                    </span>
                                </button>

                            </template>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    </div>

</template>