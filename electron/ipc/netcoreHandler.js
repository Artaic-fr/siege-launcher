const { ipcMain } = require('electron')
const { exec } = require('child_process')
const path = require('path')
const https = require('https')
const fs = require('fs')
const { createWriteStream } = require('fs')
const util = require('util')
const os = require('os')
const execPromise = util.promisify(exec)

// Vérifier si NetCore 9.0 est installé
async function checkNetCore90() {
  try {
    const { stdout } = await execPromise('dotnet --list-runtimes')
    return stdout.includes('Microsoft.NETCore.App 9.0')
  } catch (error) {
    // dotnet n'est pas installé ou inaccessible
    return false
  }
}

// Télécharger NetCore 9.0
async function downloadNetCore90() {
  return new Promise((resolve, reject) => {
    const downloadUrl = 'https://aka.ms/dotnet/9.0/windowsdesktop-runtime-win-x64.exe'
    const installerPath = path.join(os.tmpdir(), 'netcore-9.0-installer.exe')

    const file = createWriteStream(installerPath)
    
    https.get(downloadUrl, (response) => {
      // Gérer les redirections
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file)
          file.on('finish', () => {
            file.close()
            resolve(installerPath)
          })
        }).on('error', (err) => {
          fs.unlink(installerPath, () => {})
          reject(err)
        })
      } else {
        response.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve(installerPath)
        })
      }
    }).on('error', (err) => {
      fs.unlink(installerPath, () => {})
      reject(err)
    })
  })
}

// Installer NetCore 9.0 silencieusement
async function installNetCore90(installerPath) {
  return new Promise((resolve, reject) => {
    try {
      exec(`"${installerPath}" /install /quiet /norestart`, (error, stdout, stderr) => {
        // Nettoyer l'installateur
        fs.unlink(installerPath, () => {})

        if (error) {
          reject(error)
        } else {
          // Attendre un peu que l'installation soit complète
          setTimeout(() => {
            checkNetCore90().then(isInstalled => {
              resolve(isInstalled)
            }).catch(reject)
          }, 3000)
        }
      })
    } catch (error) {
      fs.unlink(installerPath, () => {})
      reject(error)
    }
  })
}

// Gestionnaire IPC pour vérifier NetCore
ipcMain.handle('check-netcore-90', async () => {
  try {
    const isInstalled = await checkNetCore90()
    return { installed: isInstalled }
  } catch (error) {
    return { installed: false, error: error.message }
  }
})

// Gestionnaire IPC pour installer NetCore
ipcMain.handle('install-netcore-90', async (event) => {
  try {
    // Envoyer la progression du téléchargement
    event.sender.send('netcore-download-start')

    const installerPath = await downloadNetCore90()
    event.sender.send('netcore-download-complete')

    // Envoyer la progression de l'installation
    event.sender.send('netcore-install-start')

    const success = await installNetCore90(installerPath)
    
    if (success) {
      event.sender.send('netcore-install-complete', { success: true })
      return { success: true }
    } else {
      event.sender.send('netcore-install-complete', { success: false, error: 'Installation failed' })
      return { success: false, error: 'Installation failed' }
    }
  } catch (error) {
    event.sender.send('netcore-install-error', error.message)
    return { success: false, error: error.message }
  }
})
