// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const ipc = require('electron').ipcRenderer;
const {dialog} = require('electron').remote;
const simpleGit = require('simple-git');

function gitOperate(path) {
    return simpleGit(path).then(function () {
        console.log('Starting fetch...');
    }).fetch(function (err, summary) {
        console.log(err);
        console.log(summary);
    }).then(function () {
        console.log('fetch done.');
    });
}


var app = new Vue({
    el: '#app',
    data() {
        return {
            title: '',
            workspaces: [],
        }
    },
    computed: {
        workspacesForSave() {
            return this.workspaces.map((item) => {
                return { title: item.title, path: item.path };
            });
        }
    },
    methods: {
        init() {
            this.bindEvents();
        },
        bindEvents() {
            ipc.on('render', (event, data) => {
                console.log(data);
                let config = JSON.parse(data);
                if (config.workspaces) {
                    config.workspaces.forEach((item) => {
                        simpleGit(item.path).status((err, summary) => {
                            item.nowBranch = summary.current;
                            this.workspaces.push(item)
                        });
                    })
                }
            });
            ipc.on('success', (event, data) => {
                console.log(data);
            });
            ipc.on('error', (event, error) => {
                console.log(error);
            })
        },
        addWorkspace() {
            dialog.showOpenDialog({ properties: ['openFile', 'openDirectory'] }, (dirs) => {
                console.log(dirs);
                if (dirs) {
                    simpleGit(dirs[0]).status((err, summary) => {
                        this.workspaces.push({
                            title: dirs[0].replace(/.+\\/gi, ''), path: dirs[0], nowBranch: summary.current
                        })
                        ipc.send('save-config', { workspaces: this.workspacesForSave });
                    }).then(function (data1, data2) {
                        console.log(data1);
                        console.log(data2);
                    })
                }
            })
        },
        selectWorkspace(item) {
            dialog.showOpenDialog({ properties: ['openFile', 'openDirectory'] }, (dirs) => {
                console.log(dirs);
                if (dirs) {
                    item.path = dirs[0];
                    item.title = dirs[0].replace(/.+\\/gi, '');
                    simpleGit(dirs[0]).status(function (err, summary) {
                        console.log(err);
                        console.log(summary);
                        item.nowBranch = summary.current;
                        ipc.send('save-config', { workspaces: this.workspacesForSave });
                    }).then(function (data1, data2) {
                        console.log(data1);
                        console.log(data2);
                    })
                }
            })
        }
    },
    created() {
        this.init()
    }
})
