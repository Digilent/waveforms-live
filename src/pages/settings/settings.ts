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
}