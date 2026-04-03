const { ipcMain, app } = require('electron')
const fs = require('fs')
const path = require('path')

ipcMain.handle('get-seasons', () => {
  const filePath = path.join(app.getAppPath(), 'shared', 'seasons.json')
  const raw = fs.readFileSync(filePath)
  var jsonData = JSON.parse(raw)
  const seasons = jsonData.seasons
  return seasons
})

ipcMain.handle('get-operators', (event, opName) => {
  const filePath = path.join(app.getAppPath(), 'shared', 'seasons.json')
  const raw = fs.readFileSync(filePath)
  var jsonData = JSON.parse(raw)
  const seasons = jsonData.seasons
  for (const season of seasons) {
    for (const operator of season.featured_operators) {
      if (operator.op_Name === opName) {
        return operator
      }
    }
  }
}
)