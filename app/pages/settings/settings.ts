import {Page} from 'ionic-angular';

//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';

@Page({
    templateUrl: 'build/pages/settings/settings.html',
})
export class SettingsPage {
    
    constructor(private deviceManager: DeviceManagerService) {
        console.log('Settings Page Constructor');
    }
}
