<script setup>
import { ref, computed } from "vue"
import { reconnectionRequired } from "../stores/downloadStore.js"

const emit = defineEmits(["close", "login-success"])

const username = ref("")
const password = ref("")
const steamGuardCode = ref("")
const errorMessage = ref("")

const isLoadingCredentials = ref(false)
const isLoadingButton = ref(false)
const guardRequired = ref(false)
const showLoginButton = ref(true)
const showGuardButton = ref(false)
const credentialsError = ref(false)
const steamGuardError = ref(false)
const maxRateError = ref(false)

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

async function closeModal() {
    // Si on ferme la modal sans succès pendant une reconnexion
    if (reconnectionRequired.value) {
        console.log("Modal fermée pendant reconnexion, annulation de tous les téléchargements")
        // Annuler tous les téléchargements
        await window.queue.cancelAllJobs()
        // Mettre à jour havebeenConnected à false
        await window.settings.set("steam.havebeenConnected", false)
        // Réinitialiser le state reconnectionRequired
        reconnectionRequired.value = false
    }
    emit("close")
    window.steam.cancelLogin()
}

async function tryLogin(username, password) {
    window.steam.loginPassword(username, password)
    isLoadingCredentials.value = true
    isLoadingButton.value = true
    maxRateError.value = false
}

window.steam.onGuardRequired(() => {
    isLoadingButton.value = false
    guardRequired.value = true
    showGuardButton.value = true
    showLoginButton.value = false
})

window.steam.onLoginError((err) => {
    console.error('Error : ', err)
    if (err.includes('InvalidPassword')) {
        credentialsError.value = true
        errorMessage.value = 'Invalid username or password.'
        guardRequired.value = false
        isLoadingButton.value = false
        isLoadingCredentials.value = false
    } else if (err.includes('INVALID_GUARD_CODE')) {
        steamGuardError.value = true
        errorMessage.value = 'Invalid Steam Guard code.'
        isLoadingButton.value = false
    } else if(err.includes('RateLimitExceeded')){
        maxRateError.value = true
        errorMessage.value = 'Too many login attempts. Please wait and try again later.'
        isLoadingButton.value = false
        isLoadingCredentials.value = false
        guardRequired.value = false
    }
})

window.steam.onLoginSuccess(async (data) => {
    await window.settings.set("steam.lastUsername", data.username)
    await window.settings.set("steam.havebeenConnected", true)
    // Réinitialiser re connexion state
    reconnectionRequired.value = false
    emit("login-success")
    closeModal()
})

function submitGuardCode() {
    if (isGuardValid.value) {
        window.steam.sendGuardCode(steamGuardCode.value)
        isLoadingButton.value = true
    }
}

function guardFunction() {
    steamGuardCode.value = steamGuardCode.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    steamGuardError.value = false
    if (steamGuardCode.value.length === 5 && !isGuardValid.value) {
        steamGuardError.value = true
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
                            @input="credentialsError = false" placeholder="Enter your Steam username" :class="[
                                'w-full p-3 rounded text-sm outline-none transition-all',
                                isLoadingCredentials
                                    ? 'bg-[#1a232e]/50 border border-white/5 text-slate-500 cursor-not-allowed'
                                    : credentialsError
                                        ? 'bg-[#1a232e] border border-red-500 text-white focus:border-red-500'
                                        : 'bg-[#1a232e] border border-white/10 text-white focus:border-primary'
                            ]" />
                    </div>

                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                            Steam Password
                        </label>

                        <input v-model="password" :disabled="isLoadingCredentials" type="password"
                            @input="credentialsError = false" placeholder="Enter your password" :class="[
                                'w-full p-3 rounded text-sm outline-none transition-all',
                                isLoadingCredentials
                                    ? 'bg-[#1a232e]/50 border border-white/5 text-slate-500 cursor-not-allowed'
                                    : credentialsError
                                        ? 'bg-[#1a232e] border border-red-500 text-white focus:border-red-500'
                                        : 'bg-[#1a232e] border border-white/10 text-white focus:border-primary'
                            ]" />
                    </div>

                    <div v-if="guardRequired">
                        <label class="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                            Steam Guard Code
                        </label>

                        <input v-model="steamGuardCode" :disabled="isLoading" maxlength="5" placeholder="XXXXX"
                            @input="guardFunction()" :class="[
                                'w-full p-3 rounded text-sm outline-none text-center transition-all',
                                isLoading
                                    ? 'bg-[#1a232e]/50 border border-white/5 text-slate-500 cursor-not-allowed'
                                    : steamGuardError
                                        ? 'bg-[#1a232e] border border-red-500 text-white focus:border-red-500'
                                        : 'bg-[#1a232e] border border-white/10 text-white focus:border-primary'
                            ]" />
                    </div>

                    <p v-if="credentialsError || steamGuardError || maxRateError" class="text-red-500 text-xs mt-2 font-medium">
                        {{ errorMessage }}
                    </p>

                    <button v-if="showGuardButton" @click="submitGuardCode"
                        :disabled="!isFormValid || isLoadingButton || steamGuardError" :class="[
                            'w-full font-bold py-3 rounded text-sm transition-all flex items-center justify-center gap-2',

                            // 🔴 Champs vides
                            !isGuardValid && !isLoadingButton || steamGuardError
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

                    <button v-if="showLoginButton" @click="tryLogin(username, password)"
                        :disabled="!isFormValid || isLoadingButton || credentialsError" :class="[
                            'w-full font-bold py-3 rounded text-sm transition-all flex items-center justify-center gap-2',

                            // 🔴 Champs vides
                            (!isFormValid && !isLoadingButton) && !credentialsError
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'

                                // 🔵 Prêt à login
                                : isFormValid && !isLoadingButton && !credentialsError
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
                        Scan this QR Code with the Steam mobile app to login securely. (WIP - Not implemented yet)
                    </p>

                </div>

            </div>

        </div>

    </div>
</template>