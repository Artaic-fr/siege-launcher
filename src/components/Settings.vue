<script setup>
import { ref, onMounted } from 'vue'
import SteamLoginModal from './SteamLoginModal.vue'

const username = ref("")
const homeDir = ref("")
const gameDir = ref("")
const steamUsername = ref("")
const userInputUsername = ref("")
const appVersion = ref("")
const updateStatus = ref('Ready')
const isCheckingUpdate = ref(false)
const updateAvailable = ref(false)
const availableVersion = ref("")

const showSteamLoginModal = ref(false)
const steamConnected = ref(false)
const isUsernameValid = ref(false)
const selectedSection = ref('account')

const emit = defineEmits(['close'])

onMounted(async () => {
    username.value = await window.settings.get("username")
    homeDir.value = await window.settings.homeDir()
    gameDir.value = await window.settings.get("downloads.installPath")
    steamUsername.value = await window.settings.get("steam.lastUsername")
    appVersion.value = await window.settings.appVersion()

    if (await window.settings.get("steam.havebeenConnected")) {
        steamConnected.value = true
    }

    window.autoUpdate.onChecking(() => {
        updateStatus.value = 'Vérification des mises à jour...'
        isCheckingUpdate.value = true
        updateAvailable.value = false
    })

    window.autoUpdate.onUpdateAvailable((info) => {
        updateAvailable.value = true
        availableVersion.value = info.version
        updateStatus.value = `Mise à jour disponible : ${info.version}`
        isCheckingUpdate.value = false
    })

    window.autoUpdate.onUpdateNotAvailable(() => {
        updateAvailable.value = false
        updateStatus.value = 'Aucune mise à jour disponible.'
        isCheckingUpdate.value = false
    })

    window.autoUpdate.onDownloadProgress((progress) => {
        updateStatus.value = `Téléchargement : ${Math.round(progress.percent)}%`
    })

    window.autoUpdate.onUpdateDownloaded(() => {
        updateStatus.value = 'Mise à jour téléchargée. Redémarrez pour installer.'
    })

    window.autoUpdate.onUpdateError((err) => {
        updateAvailable.value = false
        updateStatus.value = `Erreur de mise à jour : ${err}`
        isCheckingUpdate.value = false
    })
})

function editUsername() {
    const newUsername = document.getElementById('UserInputusername').value
    if (!/^[A-Za-z][A-Za-z0-9._-]{2,14}$/.test(newUsername)) {
        alert("Invalid username! Must be 3-15 characters, start with a letter, and can only contain letters, numbers, dots, underscores, or hyphens.")
    } else {
        window.settings.set("username", newUsername)
    }
}

function openAppDir() {
    window.settings.openAppDir()
}

function selectGameDir() {
    window.settings.selectGameDir().then((selectedPath) => {
        if (selectedPath) {
            window.settings.set("downloads.installPath", selectedPath)
            gameDir.value = selectedPath
        }
    })
}

function closeSettings() {
    emit('close')
}

function selectSection(section) {
    selectedSection.value = section
}

function SteamLoginModalClose() {
    showSteamLoginModal.value = false
    reloadSteamInfo()
}

function openSteamLoginModal() {
    showSteamLoginModal.value = true
}

function reloadSteamInfo() {
    window.settings.get("steam.lastUsername").then((data) => {
        steamUsername.value = data
    })
    window.settings.get("steam.havebeenConnected").then((data) => {
        steamConnected.value = data
    })
}

function checkUsername() {
    const input = document.getElementById('UserInputusername')
    const value = input.value
    if (!/^[A-Za-z][A-Za-z0-9._-]{2,14}$/.test(value)) {
        input.classList.add('border-red-500')
        input.classList.remove('border-white/10')
    } else {
        input.classList.remove('border-red-500')
        input.classList.add('border-white/10')
    }
}

async function checkForUpdates() {
    isCheckingUpdate.value = true
    updateStatus.value = 'Vérification des mises à jour...'
    const result = await window.autoUpdate.checkForUpdates()
    if (result && result.error) {
        updateStatus.value = `Erreur de vérification : ${result.error}`
        isCheckingUpdate.value = false
    }
}

</script>

<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        id="settings-modal" @click.self="closeSettings">
        <div
            class="bg-background-dark border border-white/10 w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden rounded-lg shadow-2xl relative">
            <button class="absolute top-4 right-4 text-slate-400 hover:text-white z-50" @click="closeSettings">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex flex-1 overflow-hidden">
                <aside class="w-20 md:w-64 border-r border-white/10 flex flex-col bg-black/20">
                    <div class="p-6">
                        <h2 class="hidden md:block text-xs font-black uppercase tracking-[0.2em] text-primary">
                            Settings</h2>
                    </div>
                    <nav class="flex-1 px-2 space-y-1">
                        <button
                            @click="selectSection('account')"
                            :class="selectedSection === 'account' ? 'w-full flex items-center gap-3 px-4 py-3 bg-primary/10 border-l-4 border-primary text-white' : 'w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition-all'">
                            <span class="material-symbols-outlined text-xl">person</span>
                            <span class="hidden md:block font-bold text-sm uppercase italic">Account</span>
                        </button>
                        <button
                            @click="selectSection('storage')"
                            :class="selectedSection === 'storage' ? 'w-full flex items-center gap-3 px-4 py-3 bg-primary/10 border-l-4 border-primary text-white' : 'w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition-all'">
                            <span class="material-symbols-outlined text-xl">database</span>
                            <span class="hidden md:block font-bold text-sm uppercase italic">Storage</span>
                        </button>
                        <button
                            @click="selectSection('update')"
                            :class="selectedSection === 'update' ? 'w-full flex items-center gap-3 px-4 py-3 bg-primary/10 border-l-4 border-primary text-white' : 'w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition-all'">
                            <span class="material-symbols-outlined text-xl">system_update</span>
                            <span class="hidden md:block font-bold text-sm uppercase italic">Update</span>
                        </button>
                        <button
                            @click="selectSection('language')"
                            :class="selectedSection === 'language' ? 'w-full flex items-center gap-3 px-4 py-3 bg-primary/10 border-l-4 border-primary text-white' : 'w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition-all'">
                            <span class="material-symbols-outlined text-xl">translate</span>
                            <span class="hidden md:block font-bold text-sm uppercase italic">Language</span>
                        </button>
                        <button
                            @click="selectSection('about')"
                            :class="selectedSection === 'about' ? 'w-full flex items-center gap-3 px-4 py-3 bg-primary/10 border-l-4 border-primary text-white' : 'w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition-all'">
                            <span class="material-symbols-outlined text-xl">info</span>
                            <span class="hidden md:block font-bold text-sm uppercase italic">About</span>
                        </button>
                    </nav>
                </aside>
                <main class="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
                    <div class="space-y-12">
                        <section v-show="selectedSection === 'account'">
                            <h3
                                class="text-xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-3">
                                <span class="w-2 h-6 bg-primary"></span>
                                Account Settings
                            </h3>
                            <div class="space-y-6">
                                <div class="p-4 bg-white/5 border border-white/10 rounded">
                                    <label
                                        class="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">Username</label>
                                    <div class="flex flex-col md:flex-row gap-4">
                                        <input
                                            class="flex-1 bg-[#1a232e] border text-white p-3 rounded text-sm outline-none"
                                            type="text" id="UserInputusername" :v-model="userInputUsername"
                                            :value="username" v-on:input="checkUsername" />
                                        <button
                                            class="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-bold uppercase text-xs tracking-widest transition-colors"
                                            @click="editUsername(userInputUsername)">Edit
                                            Username</button>
                                    </div>
                                </div>
                                <div class="mt-8">
                                    <h4
                                        class="text-xs font-black uppercase tracking-[0.15em] text-slate-500 mb-4 border-b border-white/5 pb-2">
                                        Steam Configuration
                                    </h4>
                                    <div class="p-4 bg-white/5 border border-white/10 rounded">
                                        <div class="flex flex-col lg:flex-row gap-6 items-center">
                                            <!-- Left: Status + Steam Username -->
                                            <div class="flex-1 space-y-3">
                                                <div>
                                                    <label
                                                        class="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                                                        Steam Username
                                                    </label>
                                                    <input v-model="steamUsername"
                                                        class="w-full bg-[#1a232e] border border-white/10 text-white p-3 rounded text-sm focus:border-primary outline-none cursor-not-allowed"
                                                        type="text" readonly
                                                        :placeholder="steamUsername || 'Not connected'" />
                                                </div>

                                                <div>
                                                    <label
                                                        class="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                                                        Status
                                                    </label>
                                                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full"
                                                        :class="steamConnected ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'">
                                                        <span class="relative flex h-2 w-2">
                                                            <span v-if="steamConnected"
                                                                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                            <span
                                                                :class="steamConnected ? 'bg-green-500' : 'bg-red-500'"
                                                                class="relative inline-flex rounded-full h-2 w-2"></span>
                                                        </span>
                                                        <span class="text-[10px] font-black uppercase tracking-tighter"
                                                            :class="steamConnected ? 'text-green-500' : 'text-red-500'">
                                                            {{ steamConnected ? 'Connected' : 'Disconnected' }}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Right: Connect Button -->
                                            <div
                                                class="flex-1 flex flex-col items-center justify-center space-y-3 text-center">
                                                <div>Connection to Steam</div>

                                                <button @click="openSteamLoginModal"
                                                    class="bg-primary hover:bg-primary/80 text-black font-bold py-3 px-6 rounded text-sm transition-colors">
                                                    Connect
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section v-show="selectedSection === 'storage'">
                            <h3
                                class="text-xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-3">
                                <span class="w-2 h-6 bg-primary"></span>
                                Storage &amp; Paths
                            </h3>
                            <div class="space-y-6">
                                <div class="p-4 bg-white/5 border border-white/10 rounded">
                                    <label
                                        class="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">Launcher
                                        Installation Path</label>
                                    <div class="flex items-center gap-2">
                                        <input
                                            class="flex-1 bg-black/40 border border-white/5 text-slate-400 p-3 rounded text-sm outline-none"
                                            readonly="" type="text" :value="homeDir" />
                                        <button
                                            class="size-11 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded"
                                            @click="openAppDir">
                                            <span class="material-symbols-outlined text-sm">folder_open</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="p-4 bg-white/5 border border-white/10 rounded">
                                    <label
                                        class="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">Default
                                        Installation Path</label>
                                    <div class="flex items-center gap-2">
                                        <input
                                            class="flex-1 bg-[#1a232e] border border-white/10 text-white p-3 rounded text-sm focus:border-primary outline-none"
                                            type="text" :value="gameDir" />
                                        <button
                                            class="px-6 h-11 bg-primary text-white font-bold uppercase text-xs tracking-widest flex items-center gap-2"
                                            @click="selectGameDir">
                                            <span class="material-symbols-outlined text-sm">folder_open</span>
                                            Browse
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section v-show="selectedSection === 'update'">
                            <h3
                                class="text-xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-3">
                                <span class="w-2 h-6 bg-primary"></span>
                                Mise à jour de l’application
                            </h3>
                            <div class="space-y-6">
                                <div class="p-4 bg-white/5 border border-white/10 rounded">
                                    <label class="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                                        Version actuelle
                                    </label>
                                    <div class="flex flex-wrap gap-3 items-center">
                                        <span class="bg-black/40 text-white px-3 py-2 rounded text-sm">{{ appVersion || 'Unknown' }}</span>
                                        <button
                                            class="px-5 py-2 bg-primary text-black font-bold uppercase text-xs tracking-widest rounded transition-colors hover:bg-primary/80 disabled:opacity-50"
                                            :disabled="isCheckingUpdate"
                                            @click="checkForUpdates">
                                            {{ isCheckingUpdate ? 'Vérification...' : 'Vérifier les mises à jour' }}
                                        </button>
                                    </div>
                                    <p class="text-sm text-slate-300 mt-3">{{ updateStatus }}</p>
                                </div>
                            </div>
                        </section>
                        <section v-show="selectedSection === 'language'">
                            <h3
                                class="text-xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-3">
                                <span class="w-2 h-6 bg-primary"></span>
                                Default Language
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="p-4 bg-white/5 border border-white/10 rounded">
                                    <label
                                        class="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">Default
                                        Audio</label>
                                    <select
                                        class="w-full bg-[#1a232e] border border-white/10 text-white p-3 rounded text-sm focus:border-primary outline-none">
                                        <option>English</option>
                                        <option>French</option>
                                        <option>German</option>
                                        <option>Russian</option>
                                        <option>Spanish</option>
                                    </select>
                                </div>
                                <div class="p-4 bg-white/5 border border-white/10 rounded">
                                    <label
                                        class="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">Default
                                        Text</label>
                                    <select
                                        class="w-full bg-[#1a232e] border border-white/10 text-white p-3 rounded text-sm focus:border-primary outline-none">
                                        <option>English</option>
                                        <option>French</option>
                                        <option>German</option>
                                        <option>Russian</option>
                                        <option>Spanish</option>
                                    </select>
                                </div>
                            </div>
                        </section>
                        <section v-show="selectedSection === 'about'">
                            <h3
                                class="text-xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-3">
                                <span class="w-2 h-6 bg-primary"></span>
                                About Siege Launcher
                            </h3>

                            <div class="space-y-6">
                                <div class="p-4 bg-white/5 border border-white/10 rounded">
                                    <h4 class="text-sm font-black uppercase tracking-[0.15em] text-primary mb-3">Packages utilisées</h4>
                                    <ul class="list-disc list-inside space-y-2 text-sm text-slate-300">
                                        <li><a href="https://github.com/vuejs/core" target="_blank" class="text-primary hover:underline">VueJS</a></li>
                                        <li><a href="https://github.com/electron/electron" target="_blank" class="text-primary hover:underline">Electron</a></li>
                                        <li><a href="https://github.com/tailwindlabs/tailwindcss" target="_blank" class="text-primary hover:underline">TailWindCSS</a></li>
                                        <li><a href="https://github.com/SteamRE/DepotDownloader" target="_blank" class="text-primary hover:underline">Steam Depot Downloader</a></li>
                                        <li><a href="https://github.com/marcopixel/r6operators" target="_blank" class="text-primary hover:underline">R6 Operators</a></li>
                                        <li><a href="https://github.com/lungu19/ThrowbackLoader" target="_blank" class="text-primary hover:underline">ThrowbackLoader</a></li>
                                    </ul>
                                </div>

                                <div class="p-4 bg-white/5 border border-white/10 rounded">
                                    <h4 class="text-sm font-black uppercase tracking-[0.15em] text-primary mb-3">Contact</h4>
                                    <div class="space-y-2 text-sm text-slate-300">
                                        <p>Discord: <span class="text-white font-bold">@Artaic</span></p>
                                        <p>Email: <a href="mailto:contact@artaic.fr" class="text-primary hover:underline">contact@artaic.fr</a></p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    </div>
    <SteamLoginModal v-if="showSteamLoginModal" @close="SteamLoginModalClose" />
</template>