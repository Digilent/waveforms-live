import { Component, Input } from '@angular/core';
import { PopoverController } from 'ionic-angular';

//Components 
import { TriggerPopover } from '../trigger-popover/trigger-popover.component';
import { GenPopover } from '../gen-popover/gen-popover.component';
import { DeviceComponent } from '../device/device.component';
import { SilverNeedleChart } from '../chart/chart.component';

//Services
import { DeviceManagerService } from '../../services/device/device-manager.service';
import { ToastService } from '../../services/toast/toast.service';

@Component({
    templateUrl: 'trigger.html',
    selector: 'trigger'
})
export class TriggerComponent {
    @Input() chart: SilverNeedleChart;
    public toastService: ToastService;
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

    constructor(_popoverCtrl: PopoverController, _devMngSrv: DeviceManagerService, _toastService: ToastService) {
        this.popoverCtrl = _popoverCtrl;
        this.toastService = _toastService;
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

        genPopover.onWillDismiss((data) => {
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
        this.toastService.createToast('notImplemented', true);
    }

    setupLevel() {
        if (parseFloat(this.level) * 1000 > this.activeDevice.instruments.osc.chans[0].inputVoltageMax ||
            parseFloat(this.level) * 1000 - 30 < this.activeDevice.instruments.osc.chans[0].inputVoltageMin) {
                this.toastService.createToast('invalidLevel', true);
                this.level = '0';
                return;
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
        popover.onWillDismiss(data => {
        });
    }

    setTrigType(type: string) {
        this.edgeDirection = type;
    }

}
