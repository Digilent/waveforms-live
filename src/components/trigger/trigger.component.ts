import { Component } from '@angular/core';
import { PopoverController } from 'ionic-angular';

//Components 
import { TriggerPopover } from '../trigger-popover/trigger-popover.component';
import { DeviceComponent } from '../device/device.component';

//Services
import { DeviceManagerService } from '../../services/device/device-manager.service';

@Component({
    templateUrl: 'trigger.html',
    selector: 'trigger'
})
export class TriggerComponent {
    public delay: string = '0';
    public lowerThresh: string = '-30';
    public upperThresh: string = '0';
    public edgeDirection: string = 'rising';
    public triggerSource: string = 'osc 1';
    public triggerType: string = 'edge';
    public popoverCtrl: PopoverController;
    public showTriggerSettings: boolean = true;
    public imgSrc: string = 'assets/img/trigger-rising.png';
    public devMngSrv: DeviceManagerService;
    public activeDevice: DeviceComponent;
    public level: string = '0';

    constructor(_popoverCtrl: PopoverController, _devMngSrv: DeviceManagerService) {
        this.popoverCtrl = _popoverCtrl;
        this.devMngSrv = _devMngSrv;
        this.activeDevice = this.devMngSrv.devices[this.devMngSrv.activeDeviceIndex];
    }

    toggleTriggerShow() {
        this.showTriggerSettings = !this.showTriggerSettings;
    }

    setupLevel() {
        console.log('hey');
    }

    //Open series popover
    openTriggerPopover(event) {
        let popover = this.popoverCtrl.create(TriggerPopover, {
            triggerComponent: this,
        });
        popover.present({
            ev: event
        });
        popover.onDidDismiss(data => {
        });
    }

    setTrigType() {
        if (this.edgeDirection === 'rising') {
            this.edgeDirection = 'falling';
        }
        else {
            this.edgeDirection = 'rising';
        }
        this.imgSrc = this.edgeDirection === 'rising' ? 'assets/img/trigger-rising.png' : 'assets/img/trigger-falling.png'
    }

}
