<script setup>
import { ref, computed } from "vue"

const emit = defineEmits(["close"])

const username = ref("")
const password = ref("")
const steamGuardCode = ref("")

const isLoadingCredentials = ref(false)
const isLoadingButton = ref(false)
const guardRequired = ref(false)
const showLoginButton = ref(true)
const showGuardButton = ref(false)


const isFormValid = computed(() => {
    return username.value.trim() !== "" && password.value.trim() !== ""
})

const isGuardValid = computed(() => {
    return /^[A-Z0-9]{5}$/.test(steamGuardCode.value)
})

const loginMode = ref("password")

function setMode(mode) {
    loginMode.value = mode
}

function closeModal() {
    emit("close")
    window.steam.cancelLogin() // Cancel any ongoing login attempts
}

async function tryLogin(username, password) {
    console.log(await window.steam.exePath())
    window.steam.loginPassword(username, password)
    isLoadingCredentials.value = true
    isLoadingButton.value = true
}

window.steam.onGuardRequired(() => {
    isLoadingButton.value = false
    guardRequired.value = true
    showGuardButton.value = true
    showLoginButton.value = false
})

window.steam.onLoginError((err) => {
    console.error(err)
})

window.steam.onLoginSuccess(async (data) => {
    await window.settings.set("steam.lastUsername", data.username)
    await window.settings.set("steam.havebeenConnected", true)
    closeModal()
})

function submitGuardCode() {
    if (isGuardValid.value) {
        window.steam.sendGuardCode(steamGuardCode.value)
        isLoadingButton.value = true
    }
}

</script>

<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        @click.self="closeModal">

        <div
            class="bg-background-dark border border-white/10 w-full max-w-xl flex flex-col overflow-hidden rounded-lg shadow-2xl relative">

            <!-- Close button -->
            <button class="absolute top-4 right-4 text-slate-400 hover:text-white z-50" @click="closeModal">
                <span class="material-symbols-outlined">close</span>
            </button>

            <!-- Header -->
            <div class="p-6 border-b border-white/10">

                <h2 class="text-lg font-black uppercase italic tracking-tighter mb-4 flex items-center gap-3">
                    <span class="w-2 h-6 bg-primary"></span>
                    Steam Login
                </h2>

                <!-- Mode selector -->
                <div class="flex gap-2">

                    <button @click="setMode('password')"
                        class="flex-1 px-4 py-2 text-xs font-black uppercase tracking-widest border transition-colors"
                        :class="loginMode === 'password'
                            ? 'bg-primary text-black border-primary'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'">
                        Password
                    </button>

                    <button @click="setMode('qr')"
                        class="flex-1 px-4 py-2 text-xs font-black uppercase tracking-widest border transition-colors"
                        :class="loginMode === 'qr'
                            ? 'bg-primary text-black border-primary'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'">
                        QR Code
                    </button>

                </div>
            </div>

            <!-- Content -->
            <div class="flex items-center justify-center p-6 flex-1">

                <!-- Password Login -->
                <div v-if="loginMode === 'password'" class="w-full max-w-sm p-6 flex flex-col gap-4">

                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                            Steam Username
                        </label>

                        <input v-model="username" :disabled="isLoadingCredentials" type="text"
                            placeholder="Enter your Steam username" :class="[
                                'w-full p-3 rounded text-sm outline-none transition-all',
                                isLoadingCredentials
                                    ? 'bg-[#1a232e]/50 border border-white/5 text-slate-500 cursor-not-allowed'
                                    : 'bg-[#1a232e] border border-white/10 text-white focus:border-primary'
                            ]" />
                    </div>

                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                            Steam Password
                        </label>

                        <input v-model="password" :disabled="isLoadingCredentials" type="password"
                            placeholder="Enter your password" :class="[
                                'w-full p-3 rounded text-sm outline-none transition-all',
                                isLoadingCredentials
                                    ? 'bg-[#1a232e]/50 border border-white/5 text-slate-500 cursor-not-allowed'
                                    : 'bg-[#1a232e] border border-white/10 text-white focus:border-primary'
                            ]" />
                    </div>

                    <div v-if="guardRequired">
                        <label class="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                            Steam Guard Code
                        </label>

                        <input v-model="steamGuardCode" :disabled="isLoading" maxlength="5" placeholder="XXXXX"
                            @input="steamGuardCode = steamGuardCode.toUpperCase().replace(/[^A-Z0-9]/g, '')" :class="[
                                'w-full p-3 rounded text-sm outline-none tracking-widest text-center transition-all',
                                isLoading
                                    ? 'bg-[#1a232e]/50 border border-white/5 text-slate-500 cursor-not-allowed'
                                    : 'bg-[#1a232e] border border-white/10 text-white focus:border-primary'
                            ]" />
                    </div>

                    <button v-if="showGuardButton" @click="submitGuardCode" :disabled="!isFormValid || isLoadingButton" :class="[
                        'w-full font-bold py-3 rounded text-sm transition-all flex items-center justify-center gap-2',

                        // 🔴 Champs vides
                        !isGuardValid && !isLoadingButton
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'

                            // 🔵 Prêt à login
                            : isGuardValid && !isLoadingButton
                                ? 'bg-primary hover:bg-primary/80 text-black cursor-pointer'

                                // 🔒 Chargement
                                : 'bg-primary/70 text-black/70 cursor-not-allowed'
                    ]">

                        <!-- Loader -->
                        <span v-if="isLoadingButton"
                            class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin">
                        </span>

                        <!-- Texte -->
                        <span>
                            {{ isLoadingButton ? "Connecting..." : "Login" }}
                        </span>

                    </button>

                    <button v-if="showLoginButton" @click="tryLogin(username, password)" :disabled="!isFormValid || isLoadingButton" :class="[
                        'w-full font-bold py-3 rounded text-sm transition-all flex items-center justify-center gap-2',

                        // 🔴 Champs vides
                        !isFormValid && !isLoadingButton
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'

                            // 🔵 Prêt à login
                            : isFormValid && !isLoadingButton
                                ? 'bg-primary hover:bg-primary/80 text-black cursor-pointer'

                                // 🔒 Chargement
                                : 'bg-primary/70 text-black/70 cursor-not-allowed'
                    ]">

                        <!-- Loader -->
                        <span v-if="isLoadingButton"
                            class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin">
                        </span>

                        <!-- Texte -->
                        <span>
                            {{ isLoadingButton ? "Connecting..." : "Login" }}
                        </span>

                    </button>

                </div>

                <!-- QR Login -->
                <div v-if="loginMode === 'qr'" class="flex flex-col items-center gap-6 text-center">

                    <div class="w-48 h-48 bg-white/10 border border-white/10 rounded flex items-center justify-center">
                        <!-- Placeholder QR -->
                        <span class="material-symbols-outlined text-5xl text-slate-500">
                            qr_code
                        </span>
                    </div>

                    <p class="text-sm text-slate-400 max-w-xs">
                        Scan this QR Code with the Steam mobile app to login securely.
                    </p>

                </div>

            </div>

        </div>

    </div>
</template>