import { Component } from '@angular/core';
import { PopoverController } from 'ionic-angular';

//Components 
import { DeviceComponent } from '../device/device.component';
import { LaPopover } from '../la-popover/la-popover.component';

//Services
import { DeviceManagerService } from '../../services/device/device-manager.service';

@Component({
    templateUrl: 'la-controls.html',
    selector: 'la-controls'
})
export class LaComponent {
    public popoverCtrl: PopoverController;
    public devMngSrv: DeviceManagerService;
    public activeDevice: DeviceComponent;

    public laChans: number[] = [];
    public displayChan: boolean[] = [];

    constructor(_popoverCtrl: PopoverController, _devMngSrv: DeviceManagerService) {
        this.popoverCtrl = _popoverCtrl;
        this.devMngSrv = _devMngSrv;
        this.activeDevice = this.devMngSrv.devices[this.devMngSrv.activeDeviceIndex];
        for (let i = 0; i < this.activeDevice.instruments.la.numChans; i++) {
            this.laChans.push(i);
            this.displayChan.push(false);
        }
    }

    //Open series popover
    openLaPopover(event) {
        let popover = this.popoverCtrl.create(LaPopover, {
            laComponent: this,
        });
        popover.present({
            ev: event
        });
    }

    toggleChanDisplay(laChan: number) {
        this.displayChan[laChan] = !this.displayChan[laChan];
    }

}
