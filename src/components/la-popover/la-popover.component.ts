import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

import { DeviceManagerService, DeviceService } from 'dip-angular2/services';

@Component({
    templateUrl: 'la-popover.html'
})

export class LaPopover {
    public pinoutAddress: string;
    public activeDevice: DeviceService;
    public laChans: number[] = [];
    public bitmask: string = '';

    constructor(
        public viewCtrl: ViewController, 
        public deviceManagerService: DeviceManagerService
    ) {
        this.activeDevice = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
        for (let i = 0; i < this.activeDevice.instruments.la.chans[0].numDataBits; i++) {
            this.laChans.push(i + 1);
            this.bitmask += 'x';
        }
    }

    //Close popover and send option string as a NavParam
    close(option: string) {
        this.viewCtrl.dismiss({
            option: option
        });
    }
}