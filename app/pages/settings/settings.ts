import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';

//Pages
import {DcTestPage} from '../../pages/instrument-test-pages/dc-test/dc-test';


//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';

@Component({
    templateUrl: 'build/pages/settings/settings.html',
})
export class SettingsPage {

    private nav: NavController;

    private deviceManangerService: DeviceManagerService;   
    private localSimDevUri = 'http://localhost:8080';
    private remotesimDevUri = 'https://35oopc6de8.execute-api.us-west-2.amazonaws.com/dev';
    

    constructor(_nav: NavController, _deviceManagerService: DeviceManagerService) {
        this.nav = _nav;
        this.deviceManangerService = _deviceManagerService;
    }

    connect(targetUri: string) {
        this.deviceManangerService.connect(targetUri);
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

    navToDcTestPage(deviceIndex: number) {
        this.deviceManangerService.setActiveDevice(deviceIndex);
        this.nav.push(DcTestPage);
    }
}