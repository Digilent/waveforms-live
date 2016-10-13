import { Component } from '@angular/core';
import { PopoverController } from 'ionic-angular';

//Components
import { GenPopover } from '../../components/gen-popover/gen-popover.component';

//Services
import { StorageService } from '../../services/storage/storage.service';

@Component({
    templateUrl: 'settings.html',
})
export class SettingsPage {
    public storageService: StorageService;
    public popoverCtrl: PopoverController;
    public defaultConsoleLog;
    public logArguments;

    constructor(_storageService: StorageService, _popCtrl: PopoverController) {
        this.storageService = _storageService;
        this.popoverCtrl = _popCtrl;
        console.log('settings constructor');
        this.defaultConsoleLog = window.console.log;
    }

    changeConsoleLog(event) {
        console.log(this.defaultConsoleLog, window.console);
        let popover = this.popoverCtrl.create(GenPopover, {
            dataArray: ['console', 'local storage', 'both']
        });
        popover.onDidDismiss((data) => {
            if (data === null) { return; }
            if (data.option === 'console') {
                console.log('hey');
                window.console.log = this.defaultConsoleLog;
            }
            else if (data.option === 'local storage') {
                window.console.log = this.localStorageLog.bind(this);
            }
            else if (data.option === 'both') {
                window.console.log = this.bothLog.bind(this);
            }
        });
        popover.present({
            ev: event
        });
    }

    localStorageLog() {
        let appLog;
        this.logArguments = []
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
            appLog.push(this.logArguments);
            this.storageService.saveData('appLog', JSON.stringify(appLog));
        }.bind(this));
        this.defaultConsoleLog.apply(window.console, [{
            hey: 'test'
        }]);
    }

    bothLog() {
        this.localStorageLog();
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
                console.log(appLog);
                for (let log of appLog) {
                    let logCall = '';
                    for (let parameter of log) {
                        console.log(typeof(parameter));
                        console.log(parameter);
                        if (typeof(parameter) === 'object') {
                            logCall += JSON.stringify(parameter) + ' ';
                        }
                        else {
                            logCall += parameter + ' ';
                        }
                    }
                    csvContent += logCall + '\r\n';
                }
            }
            console.log(csvContent);

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