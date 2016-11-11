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
            gitExecuting: false,
            fileLog: {
                allAuthors: [],
                items: [],
            }
        }
    },
    computed: {
        workspacesForSave() {
            return this.workspaces.map((item) => {
                return { title: item.title, path: item.path, fileLog: item.fileLog };
            });
        }
    },
    methods: {
        init() {
            this.bindEvents();
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
            // setTimeout(this.refreshWorkspaces.bind(this), 5000)
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
        getFileLog() {
            let item = this.targetItem, {after, level, selectedAuthors, items} = item.fileLog;
            item.fileLog = { selectedAuthors: selectedAuthors, level: level, after: after };
            this.setConfig();
            if (after) {
                let options = {
                    'format': { 'res': '' },
                    '--name-only': null,
                    '--after': after
                };
                selectedAuthors.length && (options['--author'] = selectedAuthors.join('\\|'));
                console.log(options);
                this.gitExecuting = true;
                this.fileLog.items = [];
                simpleGit(item.path).pull().log(options, (err, summary) => {
                    let fileList = summary.all.map((item) => {
                        let fileArr = item.res.split('\/');
                        --fileArr.length;
                        fileArr.length = fileArr.length > level ? level : fileArr.length;
                        return fileArr.join('\/');
                    });
                    this.fileLog.items = [...(new Set(fileList))].sort();
                    this.gitExecuting = false;
                })
            }
        },
        showLogModal(item) {
            this.targetItem = item;
            this.fileLog.level = item.fileLog.level;
            this.fileLog.after = item.fileLog.after;
            this.fileLog.selectedAuthors = item.fileLog.selectedAuthors;
            $('#fileViewer').modal('show');
            $('#fileLog_after').datepicker({
                format: "yyyy-mm-dd",
                language: "zh-CN",
                autoclose: true,
                todayHighlight: true
            }).off('change').on('change', (event) => {
                this.fileLog.after = event.target.value;
            });
            simpleGit(item.path).pull().log({ 'format': { 'author': '%aN' } }, (err, summary) => {
                let authorMap = new Map();
                summary.all.forEach((item) => {
                    authorMap.get(item.author) ? ++authorMap.get(item.author).count : authorMap.set(item.author, { "name": item.author, "count": 1 });
                });
                this.fileLog.allAuthors = [...authorMap.values()].sort((a, b) => {
                    return b.count - a.count;
                });
            })
        }
    },
    created() {
        this.init()
    }
})
