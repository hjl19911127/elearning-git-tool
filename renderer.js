// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const ipc = require('electron').ipcRenderer;
const {dialog} = require('electron').remote;

ipc.on('render', function (e, m) {
    console.log(e);
    console.log(m);
})
function selectFolder(id) {
    dialog.showOpenDialog({properties: ['openFile', 'openDirectory']}, function (dirs) {
        console.log(dirs);
        document.getElementById(id + '_path').value = dirs[0]
        ipc.send('SAVECONFIG', {id: id, path: dirs[0]})
    })
}
document.addEventListener('click', function (event) {
    var targetId = event.target.id;
    if (~targetId.indexOf('_button')) {
        selectFolder(targetId.replace('_button', ''))
    }
}, false)
ipc.send('pppp')

