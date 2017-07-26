import { Injectable } from '@angular/core';

//Services
import { StorageService } from '../storage/storage.service';
import { DeviceManagerService } from 'dip-angular2/services';

@Injectable()
export class SettingsService {

    public storageService: StorageService;
    public deviceManagerService: DeviceManagerService;
    public defaultConsoleLog;
    public logArguments = [];
    public logLength: number = 50;
    public nestedChannels: boolean = false;
    public routeToStore: boolean = true;
    public drawLaOnTimeline: boolean = false;
    public wflVersion: string = '1.1.2';
    public useDevBuilds: boolean = false;
    public androidAppLink = "market://details?id=com.digilent.waveformslive";
    public iosAppLink = "https://itunes.apple.com/us/app/waveforms-live/id1244242035";

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
        window.addEventListener('beforeunload', (event) => {
            this.storageService.saveData('appLog', JSON.stringify({log:this.logArguments}));
        });

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

        this.storageService.getData('appLog').then((data) => {
            if (data == undefined) { return; }
            let parsedData = JSON.parse(data);
            this.logArguments = parsedData.log;
        });

        this.storageService.getData('httpTimeout').then((data) => {
            console.log(data);
            if (data == undefined) { return; }
            let parsedData = JSON.parse(data);
            this.deviceManagerService.setHttpTimeout(parsedData.timeout);
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
            window.console.log = this.defaultConsoleLog;
        }
        else if (type === 'Local Storage') {
            window.console.log = this.localStorageLog.bind(this);
        }
        else if (type === 'Both') {
            window.console.log = this.bothLog.bind(this);
        }
        else if (type === 'None') {
            window.console.log = this.log;
        }
    }

    log() {}

    localStorageLog(argumentArray?) {
        for (let i = 0; i < arguments.length; i++) {
            let arg = arguments[i][0];
            if (typeof(arg) === 'object') {
                arg = JSON.stringify(arg);
            }
            this.logArguments.push(arg);
        }
        let logLength = this.logArguments.length;
        if (logLength > this.logLength) {
            this.logArguments = this.logArguments.slice(logLength - this.logLength);
        }
    }

    pushLogToLocalStorage() {

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
        let fileName = 'OpenScopeLogs.txt';
        let csvContent = 'data:text/csv;charset=utf-8,';
        if (this.logArguments.length === 0) {
            csvContent += 'No Logs Found\n';
        }
        else {
            for (let i = 0; i < this.logArguments.length; i++) {
                csvContent += this.logArguments[i] + '\r\n';
            }
        }
        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
    }

    clearAppLog() {
        this.logArguments = [];
        this.storageService.removeDataByKey('appLog');
    }

    setHttpTimeout(newTimeout: number) {
        this.deviceManagerService.setHttpTimeout(newTimeout);
        console.log(this.deviceManagerService.getHttpTimeout());
        this.storageService.saveData('httpTimeout', JSON.stringify({timeout: this.deviceManagerService.getHttpTimeout()}));
    }


}