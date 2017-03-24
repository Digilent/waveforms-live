'use strict';
const electron = require('electron');
const app = electron.app
const BrowserWindow = electron.BrowserWindow

let  mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({ width: 1280, height: 720 });
    var Args = process.argv.slice(2);
    Args.forEach(function(val) {
        if (val === "debug") {
            win.webContents.openDevTools();
        }
    });
    mainWindow.loadURL(`file://${__dirname}/platforms/browser/www/index.html`);
    mainWindow.on('closed', function() {
        mainWindow = null
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function() {
    if (mainWindow === null) {
        createWindow();
    }
});