const electron = require('electron')
const shell = require('shelljs')
const path = require('path');
const fs = require('fs');
const NodeGit = require("nodegit");
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const ipc = electron.ipcMain;
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function gitOperate() {
    var pathToRepo = require("path").resolve("E:/mine/codehuang");
    NodeGit.Repository.open(pathToRepo).then(function (repo) {
        console.log(repo);
        // Inside of this function we have an open repo
    });
}
function createWindow() {
    gitOperate();
    // Create the browser window.
    mainWindow = new BrowserWindow({ width: 800, height: 600 })
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
        var _path = path.join(__dirname, 'config.json');
        fs.readFile(_path, 'utf8', function (err, data) {
            console.log(data);
            if (err) {
                return console.log(err)
            } else {
                mainWindow.webContents.send('render', { config: config });
            }
        });
    });
    bindEvents();
}

function bindEvents() {
    ipc.on('SAVECONFIG', function (event, data) {
        saveConfig(JSON.stringify(data));
    });
    ipc.on('pppp', function () {
        shell.exec('git remote -v', { silent: true }, function (code, stdout, stderr) {
            mainWindow.webContents.send('ping', stdout)
        })
    });
}

function saveConfig(config) {
    var _path = path.join(__dirname, 'config.json');
    //var path1 = "d:\\ProjectsSpace\\ElectronProjects\\ElectronTest2\\app\\html\\config\\record.txt";
    console.log(config);//测试路径对不对的
    //console.log(_path, path1);//测试路径对不对的
    //fs.readFile(_path, 'utf8', function (err, data) {
    //    if (err) return console.log(err);
    //});
    fs.writeFile(_path, config, function (err) {
        if (!err) console.log("Success")
    })
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
