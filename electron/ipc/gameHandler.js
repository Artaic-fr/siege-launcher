const { ipcMain } = require("electron")
const gameService = require("../services/gameService.js")
const userData = require('../services/settingsService.js')

ipcMain.handle("uninstall", async (event, gamePath) => {
  const callbacks = {
    onSuccess: () => {
      var installedGames = userData.getSetting('installedGame')
      const updated = installedGames.filter(
        game => game.gameFolderPath !== gamePath
      )
      userData.setSetting('installedGame', updated)
    },
    onError: (errorMessage) => {
      console.error("Erreur lors de la suppression :", errorMessage);
    }
  }
  gameService.uninstallGame(gamePath, callbacks)
})

ipcMain.handle("openGameDir", (event, gamePath) => {
  gameService.openGameDir(gamePath)
})

ipcMain.handle("updateArgs", (event, seasonCode, args) => {
  gameService.updateGameArgs(seasonCode, args)
})

ipcMain.handle("launchGame", async (event, gameData) => {
  const callbacks = {
    onSuccess: (seasonCode) => {
      console.log("Game launched with seasonCode:", seasonCode)
      event.sender.send("game-launched", seasonCode)
    },
    onGameClosed: () => {
      event.sender.send("game-closed")
    }
  }
  await gameService.launchGame(gameData, callbacks)
})

ipcMain.handle("closeGame", (event) => {
  const callbacks = {
    onSuccess: () => {
      console.log("Game closed successfully")
      event.sender.send("game-closed")
    }
  }
  gameService.killGame(callbacks)
})