const path = require('path');
const fs = require('fs');
const globalConfig = {
    configPath: path.resolve(__dirname, '../../git-tool-config.json'),
    getConfig() {
        return new Promise((resolve, reject) => {
            var path = this.configPath;
            fs.exists(path, (exist) => {
                if (exist) {
                    fs.readFile(path, 'utf8', (err, data) => {
                        if (err) {
                            reject(err);
                        } else {
                            data = JSON.parse(data)
                            resolve(data);
                        }
                    });
                }
            });
        });
    },
    setConfig(config) {
        return new Promise((resolve, reject) => {
            var path = this.configPath;
            fs.exists(path, (exist) => {
                if (exist) {
                    fs.readFile(path, 'utf8', (err, data) => {
                        if (err) {
                            reject(err);
                        } else {
                            config = JSON.stringify(config, null, 4)
                            fs.writeFile(path, config, function (err) {
                                if (!err) {
                                    resolve('Modify Config success!');
                                } else {
                                    reject(err);
                                }
                            })
                        }
                    });
                } else {
                    config = JSON.stringify(config, null, 4)
                    fs.writeFile(path, config, function (err) {
                        if (!err) {
                            resolve('Add Config success!');
                        } else {
                            reject(err);
                        }
                    })
                }
            })
        });
    }
}
module.exports = globalConfig;