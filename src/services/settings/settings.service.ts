import { Injectable } from '@angular/core';

//Services
import { StorageService } from '../storage/storage.service';

@Injectable()
export class SettingsService {

    public storageService: StorageService;
    public defaultConsoleLog;
    public logArguments;
    public logLength: number = 50;

    constructor(_storageService: StorageService) {
        console.log('settings service constructor');
        this.storageService = _storageService;
        this.defaultConsoleLog = window.console.log;
    }

    changeConsoleLog(type: string) {
        if (type === 'console') {
            console.log('hey');
            window.console.log = this.defaultConsoleLog;
        }
        else if (type === 'local storage') {
            window.console.log = this.localStorageLog.bind(this);
        }
        else if (type === 'both') {
            window.console.log = this.bothLog.bind(this);
        }
        else if (type === 'none') {
            window.console.log = function() {};
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