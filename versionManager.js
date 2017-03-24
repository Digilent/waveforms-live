const fs = require('fs');
var versionUpdateType = 'patch';
var currentVersion = '';
var settingsServiceString = '';
var packageJsonString = '';
var configXmlString = '';
var newVersion = '';
var packageJsonPath = './package.json';
var settingsServicePath = './src/services/settings/settings.service.ts';
var configXmlPath = './config.xml';

//Function Definitions
var readFile = function readFile(fileName) {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    console.error('file dne');
                    reject('file dne');
                    return;
                }
                else {
                    reject(err);
                    throw err;
                }
            }
            resolve(data);
        });
    });
}

var writeFile = function writeFile(fileName, fileContents) {
    return new Promise((resolve, reject) => {
        fs.writeFile(fileName, fileContents, (err) => {
            if (err) {
                reject(err);
                console.error(err);
                throw err;
            }
            resolve();
        });
    });
}

var readPackageJson = function readPackageJson() {
    return new Promise((resolve, reject) => {
        readFile(packageJsonPath)
            .then((stringyPackageJson) => {
                packageJsonString = stringyPackageJson;
                resolve();
            })
            .catch((e) => {
                reject();
                throw 'Error reading package json';
            });
    });
}

var readConfigXml = function readConfigXml() {
    return new Promise((resolve, reject) => {
        readFile(configXmlPath)
            .then((stringyConfigXml) => {
                configXmlString = stringyConfigXml;
                resolve();
            })
            .catch((e) => {
                reject();
                throw 'Error reading config.xml';
            });
    });
}

var readSettingsService = function readSettingsService() {
    return new Promise((resolve, reject) => {
        readFile(settingsServicePath)
            .then((stringySettingsService) => {
                settingsServiceString = stringySettingsService;
                resolve();
            })
            .catch((e) => {
                reject();
                throw 'Error reading settings service';
            });
    });
}

var getCurrentVersion = function getCurrentVersion() {
    var packageAsJson = JSON.parse(packageJsonString);
    var version = packageAsJson.version;
    if (version == undefined) { throw 'Current Version Not Found' }
    return version;
}

var getNewVersion = function getNewVersion() {
    var updatedVersion;
    switch (versionUpdateType) {
        case 'patch':
            var splitArray = currentVersion.split('.');
            splitArray[2]++;
            updatedVersion = splitArray.join('.');
            break;
        case 'minor':
            var splitArray = currentVersion.split('.');
            splitArray[1]++;
            splitArray[2] = 0;
            updatedVersion = splitArray.join('.');
            break;
        case 'major':
            var splitArray = currentVersion.split('.');
            splitArray[0]++;
            splitArray[1] = 0;
            splitArray[2] = 0;
            updatedVersion = splitArray.join('.');
            break;
        default:
            throw 'WTF';
    }
    return updatedVersion;
}

var updatePackageJson = function updatePackageJson() {
    var packageJsonObject = JSON.parse(packageJsonString);
    packageJsonObject.version = newVersion;
    return writeFile(packageJsonPath, JSON.stringify(packageJsonObject, null, 4))
}

var updateSettingsService = function updateSettingsService() {
    var versionIndex = settingsServiceString.indexOf("public wflVersion: string = '");
    if (versionIndex === -1) {
        throw 'version not found in settings service file';
    }
    settingsServiceString = settingsServiceString.replace(/wflVersion: string = '[0-9]+.[0-9]+.[0-9]+/, "wflVersion: string = '" + newVersion);
    return writeFile(settingsServicePath, settingsServiceString);
}

var updateConfigXml = function updateConfigXml() {
    var versionIndex = configXmlString.indexOf('" version="');
    if (versionIndex === -1) {
        throw 'version not found in config xml';
    }
    configXmlString = configXmlString.replace(/" version="[0-9]+.[0-9]+.[0-9]+" xmlns="/, '" version="' + newVersion + '" xmlns="');
    return writeFile(configXmlPath, configXmlString);
}

//Start
if (process.argv[2] != undefined) {
    var temp = process.argv[2];
    switch (temp) {
        case 'patch':
            versionUpdateType = 'patch';
            break;
        case 'minor':
            versionUpdateType = 'minor';
            break;
        case 'major':
            versionUpdateType = 'major';
            break;
        default:
            throw 'Please enter version update type: patch, minor, or major';
    }
}

readPackageJson()
    .then(() => {
        return readSettingsService();
    })
    .then(() => {
        return readConfigXml();
    })
    .then(() => {
        currentVersion = getCurrentVersion();
        newVersion = getNewVersion();
        return updatePackageJson();
    })
    .then(() => {
        return updateSettingsService();
    })
    .then(() => {
        return updateConfigXml();
    })
    .then(() => {
        console.log('done');
    })
    .catch((e) => {
        throw e;
    });