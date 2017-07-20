import { Component, trigger, state, animate, transition, style } from '@angular/core';
import { PopoverController, NavController } from 'ionic-angular';

//Components
import { GenPopover } from '../../components/gen-popover/gen-popover.component';

//Services
import { StorageService } from '../../services/storage/storage.service';
import { SettingsService } from '../../services/settings/settings.service';

@Component({
    templateUrl: 'settings.html',
    animations: [
        trigger('rotate', [
            state('true', style({ transform: 'rotate(-180deg)' })),
            state('false', style({ transform: 'rotate(0deg)' })),
            transition('void => *', animate('0s')),
            transition('* <=> *', animate('250ms ease-in-out'))
        ])
    ]
})
export class SettingsPage {
    public storageService: StorageService;
    public popoverCtrl: PopoverController;
    public settingsService: SettingsService;
    public defaultConsoleLog;
    public logArguments;
    public currentSelectedDeviceInfoArray: string[] = [];
    public showAdvancedSettings: boolean = false;

    private keithCount: number = 0;
    private keithTimer: number = 0;
    public showKeith: boolean = false;
    private currentTimeout: number;
    public timeout: number;
    private ignoreFocusOut: boolean = false;

    constructor(_storageService: StorageService, _popCtrl: PopoverController, _settingsService: SettingsService, public navCtrl: NavController) {
        this.storageService = _storageService;
        this.settingsService = _settingsService;
        this.popoverCtrl = _popCtrl;
        console.log('settings constructor');
        let currentSelectedDeviceInfo = this.settingsService.getActiveDeviceInfo();
        if (currentSelectedDeviceInfo) {
            this.currentSelectedDeviceInfoArray[0] = currentSelectedDeviceInfo.deviceMake + ' ' + currentSelectedDeviceInfo.deviceModel + ' Version: ' + currentSelectedDeviceInfo.firmwareVersion;
            this.currentSelectedDeviceInfoArray[1] = currentSelectedDeviceInfo.rootUri;
        }
        this.currentTimeout = this.settingsService.deviceManagerService.getHttpTimeout();
        this.timeout = this.currentTimeout / 1000;
    }

    setTimeout() {
        let timeoutMs = this.timeout * 1000;
        if (timeoutMs === this.currentTimeout) { return; }
        this.settingsService.setHttpTimeout(timeoutMs);
        this.currentTimeout = timeoutMs;
    }

    checkForEnter(event) {
        if (event.key === 'Enter') {
            this.formatInputAndUpdate(event);
            this.ignoreFocusOut = true;
        }
    }

    inputLeave(event) {
        if (!this.ignoreFocusOut) {
            this.formatInputAndUpdate(event);
        }
        this.ignoreFocusOut = false;
    }

    formatInputAndUpdate(event) {
        let value: string = event.target.value;
        let parsedValue: number = parseFloat(value);

        let trueValue: number = parsedValue;
        if (value.indexOf('G') !== -1) {
            trueValue = parsedValue * Math.pow(10, 9);
        }
        else if (value.indexOf('M') !== -1) {
            trueValue = parsedValue * Math.pow(10, 6);
        }
        else if (value.indexOf('k') !== -1 || value.indexOf('K') !== -1) {
            trueValue = parsedValue * Math.pow(10, 3);
        }
        else if (value.indexOf('m') !== -1) {
            trueValue = parsedValue * Math.pow(10, -3);
        }
        else if (value.indexOf('u') !== -1) {
            trueValue = parsedValue * Math.pow(10, -6);
        }
        else if (value.indexOf('n') !== -1) {
            trueValue = parsedValue * Math.pow(10, -9);
        }

        if (trueValue > Math.pow(10, 9)) {
            trueValue = Math.pow(10, 9);
        }
        else if (trueValue < -Math.pow(10, 9)) {
            trueValue = -Math.pow(10, 9);
        }
        console.log(trueValue);
        this.timeout = trueValue;
    }

    saveDevBuilds(event) {
        this.settingsService.setUseDevBuilds(event);
    }

    toggleAdvancedSettings() {
        this.showAdvancedSettings = !this.showAdvancedSettings;
    }

    changeConsoleLog(event) {
        let popover = this.popoverCtrl.create(GenPopover, {
            dataArray: ['Console', 'Local Storage', 'Both', 'None']
        });
        popover.onWillDismiss((data) => {
            if (data === null) { return; }
            this.settingsService.changeConsoleLog(data.option);

        });
        popover.present({
            ev: event
        });
    }

    exportLogFile() {
        this.settingsService.exportLogFile();
    }

    clearAppLog() {
        this.settingsService.clearAppLog();
    }

    done() {
        this.navCtrl.pop();
    }

    private presentTheAlmightKeith() {
        this.showKeith = true;
        setTimeout(() => {
            this.showKeith = false;
        }, 3000);
    }
    
    keithifyMeCaptain() {
        if (this.showKeith) {
            return;
        }
        if (this.keithCount === 0) {
            this.keithTimer = performance.now();
            this.keithCount++;
            return;
        }
        let currentTime = performance.now();
        if (currentTime - this.keithTimer < 5000) {
            this.keithCount++;
            if (this.keithCount > 6) {
                this.presentTheAlmightKeith();
                this.keithCount = 0;
            }
        }
        else {
            this.keithCount = 0;
        }
    }
}