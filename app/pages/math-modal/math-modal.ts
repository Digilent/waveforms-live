import {NavParams, ViewController, Platform, PopoverController} from 'ionic-angular';
import {ViewChild, Component} from '@angular/core';

//Components
import {DeviceComponent} from '../../components/device/device.component';

//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';

@Component({
    templateUrl: "build/pages/math-modal/math-modal.html"
})
export class MathModalPage {
    private platform: Platform;
    private viewCtrl: ViewController;
    private params: NavParams;
    private popoverCtrl: PopoverController;
    private deviceManagerService: DeviceManagerService;
    private activeDevice: DeviceComponent;
    private mathChannels: string[];
    private buttonNames: Array<string[]> = [['Frequency', 'Pos Pulse Width', 'Pos Duty Cycle'], ['Period', 'Neg Pulse Width', 'Neg Duty Cycle'], 
        ['Rise Rate', 'Rise Time'], ['Amplitude', 'High', 'Low'], ['Peak to Peak', 'Maximum', 'Minimum'], ['Mean', 'RMS', 'Overshoot'], ['Cycle Mean', 'Cycle RMS', 'Undershoot']];
    
    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams,
        _popoverCtrl: PopoverController,
        _deviceManagerService: DeviceManagerService
    ) {
        this.popoverCtrl = _popoverCtrl;
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
        this.mathChannels = [];
        for (let i = 0; i < this.activeDevice.instruments.osc.chans.length; i++) {
            this.mathChannels.push('Osc ' + (i + 1));
        }
        console.log(this.mathChannels);
    }

    //Close modal and save settings if they are changed
    closeModal(save: boolean) {
        this.viewCtrl.dismiss();
    }
    
}