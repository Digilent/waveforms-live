import { Component } from '@angular/core';
import { PopoverController, ToastController } from 'ionic-angular';

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
    public toastCtrl: ToastController;
    public delay: string = '0';
    public lowerThresh: string = '-30';
    public upperThresh: string = '0';
    public edgeDirection: string = 'rising';
    public triggerSource: string = 'Osc Ch 1';
    public triggerType: string = 'edge';
    public popoverCtrl: PopoverController;
    public showTriggerSettings: boolean = true;
    public devMngSrv: DeviceManagerService;
    public activeDevice: DeviceComponent;
    public level: string = '0';

    constructor(_popoverCtrl: PopoverController, _devMngSrv: DeviceManagerService, _toastCtrl: ToastController) {
        this.popoverCtrl = _popoverCtrl;
        this.toastCtrl = _toastCtrl;
        this.devMngSrv = _devMngSrv;
        this.activeDevice = this.devMngSrv.devices[this.devMngSrv.activeDeviceIndex];
    }

    toggleTriggerShow() {
        this.showTriggerSettings = !this.showTriggerSettings;
    }

    openGenPopover(event) {
        let chanArray = [];
        for (let i = 0; i < this.activeDevice.instruments.osc.numChans; i++) {
            chanArray.push('Osc Ch ' + (i + 1));
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
            this.triggerSource = data.option;
        });
    }

    forceTrigger() {
        /*this.activeDevice.instruments.trigger.forceTrigger([1]).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );*/
        let toast = this.toastCtrl.create({
            message: 'Force Trigger Not Yet Implemented',
            showCloseButton: true,
            position: 'bottom'
        });
        toast.present();
    }

    setupLevel() {
        if (parseFloat(this.level) * 1000 > this.activeDevice.instruments.osc.chans[0].inputVoltageMax ||
            parseFloat(this.level) * 1000 - 30 < this.activeDevice.instruments.osc.chans[0].inputVoltageMin) {
                let toast = this.toastCtrl.create({
                    message: 'Selected Level Value Is Not In Osc Input Voltage Range And May Not Trigger',
                    showCloseButton: true,
                    position: 'bottom'
                });
                toast.present();
        }
        this.upperThresh = (parseFloat(this.level) * 1000).toString();
        this.lowerThresh = (parseFloat(this.upperThresh) - 30).toString();
        console.log(this.upperThresh, this.lowerThresh);
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
