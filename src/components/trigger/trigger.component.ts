import { Component } from '@angular/core';
import { PopoverController } from 'ionic-angular';

//Components 
import { TriggerPopover } from '../trigger-popover/trigger-popover.component';
import { GenPopover } from '../gen-popover/gen-popover.component';
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

    openGenPopover(event) {
            let chanArray = [];
            for (let i = 0; i < this.activeDevice.instruments.osc.numChans; i++) {
                chanArray.push('Osc ' + (i + 1));
            }
            /*for (let i = 0; i < this.triggerComponent.activeDevice.instruments.la.numChans; i++) {
                chanArray.push('La ' + (i + 1));
            }*/
            chanArray.push('Ext');

            let genPopover = this.popoverCtrl.create(GenPopover, {
                dataArray: chanArray
            });

        genPopover.present({
            ev: event
        });

        genPopover.onDidDismiss((data) => {
            if (data === null) { return; }
            console.log(data);
            let selection = data.option.toLowerCase();
            this.triggerSource = selection;
        });
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

    setTrigType(type: string) {
        this.edgeDirection = type;
    }

}
