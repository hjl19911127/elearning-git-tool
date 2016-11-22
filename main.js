const electron = require('electron');
const path = require('path');
const fs = require('fs');

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const ipc = electron.ipcMain;
//config getter setter
const globalConfig = require('./app/native/globalConfig');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({ width: 1400, height: 850 })
    // add DevTools Extension
    // addDevToolsExtension(BrowserWindow);
    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html`)
    // Open the DevTools.
    mainWindow.webContents.openDevTools()
    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
    mainWindow.webContents.on('did-finish-load', () => {
        globalConfig.getConfig().then((data) => {
            mainWindow.webContents.send('get-config', data);
        }, (err) => {
            mainWindow.webContents.send('sys-error', err);
        });
    });
    bindEvents();
}

function addDevToolsExtension(BrowserWindow) {
    let extensionPath = process.env['LOCALAPPDATA'] + '\\Google\\Chrome\\User Data\\Default\\Extensions';
    let vueDevtoolPath = extensionPath + '\\nhdogjmejiglipccpnnnanhbledajbpd'
    fs.readdir(vueDevtoolPath, (err, files) => {
        if (files[0]) {
            let finalPath = vueDevtoolPath + '\\' + files[0];
            fs.stat(finalPath, (err, stats) => {
                if (stats.isDirectory()) {
                    // BrowserWindow.removeDevToolsExtension('Vue.js devtools');
                    BrowserWindow.addDevToolsExtension(finalPath);
                }
            })
        }
    })
}

function bindEvents() {
    ipc.on('get-config', (event, data) => {
        globalConfig.getConfig().then((data) => {
            mainWindow.webContents.send('get-config', data);
        }, (err) => {
            mainWindow.webContents.send('sys-error', err);
        });
    });
    ipc.on('set-config', (event, data) => {
        globalConfig.setConfig(data).then((message) => {
            mainWindow.webContents.send('sys-success', message);
        }, (err) => {
            mainWindow.webContents.send('sys-error', err);
        });
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
