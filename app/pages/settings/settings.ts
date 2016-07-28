import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';

//Pages
import {AwgTestPage} from '../../pages/instrument-test-pages/awg-test/awg-test';
import {DcTestPage} from '../../pages/instrument-test-pages/dc-test/dc-test';
import {OscTestPage} from '../../pages/instrument-test-pages/osc-test/osc-test';


//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';
import {StorageService} from '../../services/storage/storage.service';

@Component({
    templateUrl: 'build/pages/settings/settings.html',
})
export class SettingsPage {

    private nav: NavController;

    private deviceManangerService: DeviceManagerService;   
    private localSimDevUri = 'http://localhost:8080';
    private remotesimDevUri = 'https://35oopc6de8.execute-api.us-west-2.amazonaws.com/dev';
    private storageService: StorageService;
    private showExtraInfo: boolean = false;

    constructor(_nav: NavController, _deviceManagerService: DeviceManagerService, _storageService: StorageService) {
        this.nav = _nav;
        this.deviceManangerService = _deviceManagerService;
        this.storageService = _storageService;
        console.log('settings constructor');
    }

    connect(targetUri: string) {
        this.deviceManangerService.connect(targetUri).subscribe();
    }

    //Test Code
    enumDc() {
        this.deviceManangerService.devices[0].instruments.dc.enumerate().subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        )
    }

    showInfo() {
        this.showExtraInfo = !this.showExtraInfo;
    }
    
    navToAwgTestPage(deviceIndex: number){
        this.deviceManangerService.setActiveDevice(deviceIndex);
        this.nav.push(AwgTestPage);
    }
    
    navToDcTestPage(deviceIndex: number) {
        this.deviceManangerService.setActiveDevice(deviceIndex);
        this.nav.push(DcTestPage);
    }
    
    navToOscTestPage(deviceIndex: number){
        this.deviceManangerService.setActiveDevice(deviceIndex);
        this.nav.push(OscTestPage);
    }

    sqlSave() {
        this.storageService.saveSettings();
        console.log('savingSettings');
    }

    sqlLoad() {
        this.storageService.loadSettings();
        console.log('loadingSettings');
    }
}