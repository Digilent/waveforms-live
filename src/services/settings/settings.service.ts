import { Injectable } from '@angular/core';

//Services
import { StorageService } from '../storage/storage.service';
import { DeviceManagerService } from 'dip-angular2/services';

@Injectable()
export class SettingsService {

    public storageService: StorageService;
    public deviceManagerService: DeviceManagerService;
    public defaultConsoleLog;
    public logArguments;
    public logLength: number = 50;
    public nestedChannels: boolean = false;
    public routeToStore: boolean = true;
    public drawLaOnTimeline: boolean = false;
    public wflVersion: string = '0.8.1';
    public useDevBuilds: boolean = false;

    public knownFirmwareUrls: { openscopeMz: { prettyName: string, listUrl: string, devListUrl: string, firmwareUrl: string, devFirmwareUrl: string } } = {
        openscopeMz: {
            prettyName: 'OpenScope MZ',
            listUrl: 'https://s3-us-west-2.amazonaws.com/digilent?prefix=Software/OpenScope+MZ/release/firmware/without-bootloader',
            devListUrl: 'https://s3-us-west-2.amazonaws.com/digilent?prefix=Software/OpenScope+MZ/development/firmware/without-bootloader',
            firmwareUrl: 'https://s3-us-west-2.amazonaws.com/digilent/Software/OpenScope+MZ/release/firmware/without-bootloader',
            devFirmwareUrl: 'https://s3-us-west-2.amazonaws.com/digilent/Software/OpenScope+MZ/development/firmware/without-bootloader'
        }
    };

    constructor(_storageService: StorageService, _deviceManagerService: DeviceManagerService) {
        console.log('settings service constructor');
        this.storageService = _storageService;
        this.deviceManagerService = _deviceManagerService;
        this.defaultConsoleLog = window.console.log;
        this.storageService.getData('routeToStore').then((data) => {
            if (data != null) {
                this.routeToStore = JSON.parse(data);
            }
        });
        this.storageService.getData('useDevBuilds').then((data) => {
            if (data != undefined) {
                this.useDevBuilds = JSON.parse(data);
            }
        });
    }

    setRouteToStore(route: boolean) {
        this.routeToStore = route;
        this.storageService.saveData('routeToStore', JSON.stringify(this.routeToStore));
    }

    setUseDevBuilds(useDevBuilds: boolean) {
        this.useDevBuilds = useDevBuilds;
        this.storageService.saveData('useDevBuilds', JSON.stringify(this.useDevBuilds));
    }

    getRouteToStore(): boolean {
        return this.routeToStore;
    }

    setNestedChannels(nested: boolean) {
        this.nestedChannels = nested;
    }

    getActiveDeviceInfo() {
        if (this.deviceManagerService.devices.length < 1 || this.deviceManagerService.activeDeviceIndex == undefined) {
            return undefined;
        }
        let dev = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
        let versionArray = [dev.firmwareVersion.major.toString(), dev.firmwareVersion.minor.toString(), dev.firmwareVersion.patch.toString()];
        return {
            deviceMake: dev.deviceMake,
            deviceModel: dev.deviceModel,
            firmwareVersion: versionArray.join('.'),
            rootUri: dev.rootUri
        };
    }

    changeConsoleLog(type: 'Local Storage' | 'Both' | 'None' | 'Console') {
        if (type === 'Console') {
            console.log('hey');
            window.console.log = this.defaultConsoleLog;
        }
        else if (type === 'Local Storage') {
            window.console.log = this.localStorageLog.bind(this);
        }
        else if (type === 'Both') {
            window.console.log = this.bothLog.bind(this);
        }
        else if (type === 'None') {
            window.console.log = function () { };
        }
    }

    localStorageLog(argumentArray?) {
        let appLog;
        this.logArguments = [];
        for (let i = 0; i < arguments.length; i++) {
            this.logArguments.push(arguments[i]);
        }

        this.storageService.getData('appLog').then(function (data) {
            if (data === null) {
                appLog = [];
            }
            else {
                appLog = JSON.parse(data);
            }
            if (appLog.length === this.logLength) {
                appLog.shift();
            }
            appLog.push(this.logArguments);
            this.storageService.saveData('appLog', JSON.stringify(appLog));
        }.bind(this));
    }

    bothLog() {
        this.localStorageLog(arguments);
        if (this.defaultConsoleLog.apply) {
            this.defaultConsoleLog.apply(window.console, arguments);
        }
        else {
            let message = Array.prototype.slice.apply(arguments).join(' ');
            this.defaultConsoleLog(message);
        }
    }

    exportLogFile() {
        this.storageService.getData('appLog').then((data) => {
            let fileName = 'OpenScopeLogs.txt';
            let csvContent = 'data:text/csv;charset=utf-8,';
            if (data === null) {
                csvContent += 'No Logs Found\n';
            }
            else {
                let appLog = JSON.parse(data);
                for (let log of appLog) {
                    let logCall = '';
                    for (let parameter of log) {
                        if (typeof (parameter) === 'object') {
                            logCall += JSON.stringify(parameter) + ' ';
                        }
                        else {
                            logCall += parameter + ' ';
                        }
                    }
                    csvContent += logCall + '\r\n';
                }
            }

            let encodedUri = encodeURI(csvContent);
            let link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
        });
    }

    clearAppLog() {
        this.storageService.removeDataByKey('appLog');
    }


}