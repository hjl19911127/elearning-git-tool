// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const ipc = require('electron').ipcRenderer;
const {dialog} = require('electron').remote;
const simpleGit = require('simple-git');

var app = new Vue({
    el: '#app',
    data() {
        return {
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
        setConfig() {
            ipc.send('set-config', { workspaces: this.workspacesForSave });
        },
        refresh() {
            ipc.send('get-config', { workspaces: this.workspacesForSave });
        },
        getWorkspaceStatus(item) {
            return new Promise((resolve, reject) => {
                item.branchIntoDevelop = '';
                simpleGit(item.path).status((err, summary) => {
                    if (summary) item.nowBranch = summary.current;
                }).branch((err, summary) => {
                    item.AllBranches = Object.keys(summary.branches).map((key) => {
                        return summary.branches[key];
                    })
                    resolve(item);
                });
            });
        },
        bindEvents() {
            ipc.on('get-config', (event, config) => {
                if (config.workspaces) {
                    let promises = config.workspaces.map((workspace) => {
                        return this.getWorkspaceStatus(workspace);
                    })
                    Promise.all(promises).then((res) => {
                        this.workspaces = res;
                    })
                }
            });
            ipc.on('sys-success', (event, data) => {
                console.log(data);
            });
            ipc.on('sys-error', (event, error) => {
                console.log(error);
            })
        },
        addWorkspace() {
            dialog.showOpenDialog({ properties: ['openFile', 'openDirectory'] }, (dirs) => {
                if (dirs) {
                    let workspace = { title: dirs[0].replace(/.+\\/gi, ''), path: dirs[0] };
                    this.getWorkspaceStatus(workspace).then((res) => {
                        this.workspaces.push(res);
                        this.setConfig();
                    });
                }
            })
        },
        selectWorkspace(workspace) {
            dialog.showOpenDialog({ properties: ['openFile', 'openDirectory'] }, (dirs) => {
                if (dirs) {
                    workspace.path = dirs[0];
                    workspace.title = dirs[0].replace(/.+\\/gi, '');
                    this.getWorkspaceStatus(workspace).then((res) => {
                        this.setConfig();
                    });
                }
            })
        },
        deleteWorkspace(index, item) {
            const options = {
                type: 'question',
                title: '删除工作目录',
                message: '是否要删除该工作目录 ' + item.title + ' ？',
                detail: '此操作不会删除磁盘上的文件',
                buttons: ['确定', '取消']
            };
            dialog.showMessageBox(options, (btnIndex, bb) => {
                if (!btnIndex) {
                    this.workspaces.splice(index, 1);
                    this.setConfig();
                }
            })
        }
    },
    created() {
        this.init()
    }
})
