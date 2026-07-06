<template>
  <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
      <!-- En-tête -->
      <div class="mb-4">
        <h2 class="text-xl font-bold text-white">NetCore 9.0 Requis</h2>
      </div>

      <!-- Message -->
      <div class="mb-6 text-gray-300 space-y-3">
        <p>
          Rainbow Six Siege Launcher nécessite <span class="font-semibold text-white">NetCore 9.0</span> pour fonctionner correctement.
        </p>
        <p>
          Ce composant sera téléchargé et installé automatiquement sur votre ordinateur.
        </p>
      </div>

      <!-- Barre de progression -->
      <div v-if="isInstallingOrDownloading" class="mb-6 space-y-2">
        <div class="flex justify-between text-sm text-gray-400 mb-2">
          <span>{{ statusMessage }}</span>
          <span v-if="downloadProgress">{{ downloadProgress }}%</span>
        </div>
        <div class="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            class="bg-blue-500 h-full rounded-full transition-all duration-300"
            :style="{ width: (downloadProgress || 0) + '%' }"
          ></div>
        </div>
      </div>

      <!-- Messages d'erreur -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">
        {{ errorMessage }}
      </div>

      <!-- Boutons -->
      <div class="flex gap-3">
        <button
          @click="handleCancel"
          :disabled="isInstallingOrDownloading"
          class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded font-medium transition"
        >
          {{ isInstallingOrDownloading ? 'Installation en cours...' : 'Annuler' }}
        </button>
        <button
          @click="handleInstall"
          :disabled="isInstallingOrDownloading"
          class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded font-medium transition"
        >
          {{ isInstallingOrDownloading ? 'En cours...' : 'Installer' }}
        </button>
      </div>

      <!-- Note -->
      <div class="mt-4 text-xs text-gray-500">
        <p>Note: L'ordinateur peut être redémarré après l'installation.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const showModal = ref(false)
const isDownloading = ref(false)
const isInstalling = ref(false)
const downloadProgress = ref(0)
const errorMessage = ref('')
const statusMessage = ref('')

const isInstallingOrDownloading = computed(() => isDownloading.value || isInstalling.value)

onMounted(() => {
  // Écouter le signal du processus principal pour vérifier NetCore
  if (window.netcore) {
    window.netcore.onCheckNetCore(() => {
      checkNetCore()
    })
  }
})

const checkNetCore = async () => {
  try {
    const result = await window.netcore.check()
    if (!result.installed) {
      showModal.value = true
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de NetCore:', error)
  }
}

const handleInstall = async () => {
  errorMessage.value = ''
  isDownloading.value = true
  statusMessage.value = 'Téléchargement de NetCore 9.0...'

  try {
    // Écouter les événements de progression
    window.netcore.onDownloadStart(() => {
      statusMessage.value = 'Téléchargement de NetCore 9.0...'
    })

    window.netcore.onDownloadComplete(() => {
      statusMessage.value = 'Installation de NetCore 9.0...'
      isDownloading.value = false
      isInstalling.value = true
    })

    window.netcore.onInstallStart(() => {
      statusMessage.value = 'Installation en cours...'
      downloadProgress.value = 50
    })

    window.netcore.onInstallComplete((data) => {
      if (data.success) {
        statusMessage.value = 'Installation réussie!'
        downloadProgress.value = 100
        setTimeout(() => {
          showModal.value = false
          isDownloading.value = false
          isInstalling.value = false
          downloadProgress.value = 0
        }, 1500)
      } else {
        errorMessage.value = data.error || 'L\'installation a échoué'
        isDownloading.value = false
        isInstalling.value = false
        downloadProgress.value = 0
      }
    })

    window.netcore.onInstallError((error) => {
      errorMessage.value = error || 'Une erreur est survenue lors de l\'installation'
      isDownloading.value = false
      isInstalling.value = false
      downloadProgress.value = 0
    })

    // Lancer l'installation
    const result = await window.netcore.install()
    if (!result.success) {
      errorMessage.value = result.error || 'L\'installation a échoué'
      isDownloading.value = false
      isInstalling.value = false
      downloadProgress.value = 0
    }
  } catch (error) {
    errorMessage.value = error.message || 'Une erreur est survenue'
    isDownloading.value = false
    isInstalling.value = false
    downloadProgress.value = 0
  }
}

const handleCancel = () => {
  if (!isInstallingOrDownloading.value) {
    showModal.value = false
  }
}
</script>
