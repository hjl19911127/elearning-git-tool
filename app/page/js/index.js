// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const ipc = require('electron').ipcRenderer;
const {dialog} = require('electron').remote;
const simpleGit = require('simple-git');

let app = new Vue({
    el: '#app',
    data() {
        return {
            workspaces: [],
            targetItem: null,
            fileHistory: {
                after: '',
                author: [],
                items: [],
            }
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
            $('#fileHistory').datepicker({
            });
        },
        bindEvents() {
            ipc.on('get-config', (event, config) => {
                this.syncWorkspaces(config.workspaces || []);
                setTimeout(this.refreshWorkspaces.bind(this), 5000);
            });
            ipc.on('sys-success', (event, data) => {
                console.log(data);
            });
            ipc.on('sys-error', (event, error) => {
                console.log(error);
            })
        },
        setConfig() {
            ipc.send('set-config', { workspaces: this.workspacesForSave });
        },
        refreshWorkspaces() {
            this.syncWorkspaces(this.workspaces);
            setTimeout(this.refreshWorkspaces.bind(this), 5000)
        },
        syncWorkspaces(workspaces) {
            let promises = workspaces.map((workspace) => {
                return this.getWorkspaceStatus(workspace);
            })
            Promise.all(promises).then((res) => {
                this.workspaces = res;
            })
        },
        getWorkspaceStatus(item) {
            return new Promise((resolve, reject) => {
                item.branchIntoDevelop = item.branchIntoDevelop || '';
                simpleGit(item.path).fetch((err, summary) => {
                }).status((err, summary) => {
                    if (summary) item.nowBranch = summary.current;
                }).branch((err, summary) => {
                    item.AllBranches = Object.keys(summary.branches).map((key) => {
                        return summary.branches[key];
                    })
                    resolve(item);
                });
            });
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
        deleteWorkspace(item, index) {
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
        },
        executeGitTask(item) {
            return;
            console.log(item);
            //git checkout -b sf origin/serverfix
            let nextBranchArr = item.branchIntoDevelop.split('/');
            simpleGit(item.path).branch(['-vv'], (err, summary) => {
                console.log('branch');
                console.log(summary);
            })
            simpleGit(item.path).mergeFromTo(item.branchIntoDevelop, 'remotes/origin/develop', (err, summary) => {
                console.log('mergeFromTo');
                console.log(summary);
            })
            if (item.newBranch) {
                nextBranchArr = nextBranchArr.slice(2);
                simpleGit(item.path).mergeFromTo(item.branchIntoDevelop, 'remotes/origin/develop', (err, summary) => {
                    console.log('mergeFromTo');
                    console.log(summary);
                }).checkout('develop', (err, summary) => {
                    console.log('checkout');
                    console.log(summary);
                }).pull((err, summary) => {
                    console.log('pull');
                    console.log(summary);
                }).checkoutLocalBranch(item.newBranch, (err, summary) => {
                    console.log('checkoutLocalBranch');
                    console.log(summary);
                }).push();
            }
        },
        getFileHistory() {
            var item = this.targetItem, fileList = [], after = this.fileHistory.after;
            var options = {
                'format': { 'res': '' },
                '--name-only': null,
                '--after': after,
                '--author': 'lint\\|huangjl\\|ganqz\\|llj\\|lixy\\|林涛'
            };
            simpleGit(item.path).log(options, (err, summary) => {
                console.log(summary);
                fileList = summary.all.map((item) => {
                    return item.res;
                });
                this.fileHistory.items = [...(new Set(fileList))].sort();
            })
        },
        showLogModal(item) {
            this.targetItem = item;
            this.fileHistory.after = '';
            $('#fileViewer').modal('show');
            $('#fileHistory').datepicker({
                format: "yyyy-mm-dd",
                language: "zh-CN",
                autoclose: true
            }).off('change').on('change', (event) => {
                this.fileHistory.after = event.target.value;
            });
        }
    },
    created() {
        this.init()
    }
})
