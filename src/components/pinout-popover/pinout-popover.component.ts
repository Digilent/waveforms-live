import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

import { DeviceManagerService } from 'dip-angular2/services';

@Component({
    templateUrl: 'pinout-popover.html'
})

export class PinoutPopover {

    public pinoutAddress: string;

    constructor(public viewCtrl: ViewController, public deviceManagerService: DeviceManagerService) {
        this.getPinoutAddress();
    }

    getPinoutAddress() {
        let dev = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
        if (!dev) { return; }
        let devModel = dev.deviceModel;
        console.log(devModel);
        switch (devModel) {
            case 'OpenScope MZ': 
                console.log('openscope in get pinout');
                this.pinoutAddress = 'assets/img/osmz-pinout.svg';
                break;
            default:
                console.log('No pinout found');
        }
    }

    //Close popover and send option string as a NavParam
    close(option: string) {
        this.viewCtrl.dismiss({
            option: option
        });
    }
}