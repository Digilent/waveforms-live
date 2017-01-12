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
    public level: number = 0;
    public ignoreFocusOut: boolean = false;

    constructor(_popoverCtrl: PopoverController, _devMngSrv: DeviceManagerService, _toastService: ToastService) {
        this.popoverCtrl = _popoverCtrl;
        this.toastService = _toastService;
        this.devMngSrv = _devMngSrv;
        this.activeDevice = this.devMngSrv.devices[this.devMngSrv.activeDeviceIndex];
    }

    checkForEnter(event) {
        if (event.key === 'Enter') {
            this.formatInputAndUpdate(event);
            this.ignoreFocusOut = true;
        }
    }

    inputLeave(event) {
        if (!this.ignoreFocusOut) {
            this.formatInputAndUpdate(event);
        }
        this.ignoreFocusOut = false;
    }

    formatInputAndUpdate(event) {
        let value: string = event.target.value;
        let parsedValue: number = parseFloat(value);

        let trueValue: number = parsedValue;
        if (value.indexOf('G') !== -1) {
            trueValue = parsedValue * Math.pow(10, 9);
        }
        else if (value.indexOf('M') !== -1) {
            trueValue = parsedValue * Math.pow(10, 6);
        }
        else if (value.indexOf('k') !== -1) {
            trueValue = parsedValue * Math.pow(10, 3);
        }
        else if (value.indexOf('m') !== -1) {
            trueValue = parsedValue * Math.pow(10, -3);
        }
        else if (value.indexOf('u') !== -1) {
            trueValue = parsedValue * Math.pow(10, -6);
        }
        else if (value.indexOf('n') !== -1) {
            trueValue = parsedValue * Math.pow(10, -9);
        }

        if (trueValue > Math.pow(10, 9)) {
            trueValue = Math.pow(10, 9);
        }
        else if (trueValue < -Math.pow(10, 9)) {
            trueValue = -Math.pow(10, 9);
        }
        console.log(trueValue);
        if (trueValue * 1000 > this.activeDevice.instruments.osc.chans[0].inputVoltageMax ||
            trueValue * 1000 - 30 < this.activeDevice.instruments.osc.chans[0].inputVoltageMin) {
                this.toastService.createToast('invalidLevel', true);
                this.level = 0;
                return;
        }
        if (this.level === trueValue) {
            console.log('the same');
            this.level = trueValue * 10 + 1;
            setTimeout(() => {
                this.level = trueValue;
                this.upperThresh = (this.level * 1000).toString();
                this.lowerThresh = (parseFloat(this.upperThresh) - 30).toString();
            }, 1);
            return;
        }
        this.level = trueValue;
        this.upperThresh = (this.level * 1000).toString();
        this.lowerThresh = (parseFloat(this.upperThresh) - 30).toString();
        console.log(this.upperThresh, this.lowerThresh);
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
