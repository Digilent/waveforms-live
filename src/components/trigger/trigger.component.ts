import { Component, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { PopoverController } from 'ionic-angular';

//Components
import { SilverNeedleChart } from '../chart/chart.component';
import { DropdownPopoverComponent } from '../dropdown-popover/dropdown-popover.component';
import { LaPopover } from '../la-popover/la-popover.component';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';
import { ToastService } from '../../services/toast/toast.service';
import { TooltipService } from '../../services/tooltip/tooltip.service';
import { DeviceDataTransferService } from '../../services/device/device-data-transfer.service';

@Component({
    templateUrl: 'trigger.html',
    selector: 'trigger'
})
export class TriggerComponent {
    @Input() chart: SilverNeedleChart;
    @Input() running: boolean;
    @Output('triggerTutotrialFinish') triggerTutotrialFinish = new EventEmitter();
    @ViewChild('dropPopSource') dropPopSource: DropdownPopoverComponent;
    public toastService: ToastService;
    public tooltipService: TooltipService;
    public delay: string = '0';
    public lowerThresh: string = '470';
    public upperThresh: string = '500';
    public edgeDirection: 'rising' | 'falling' | 'off' = 'rising';
    public triggerSource: string = 'Osc Ch 1';
    public triggerSources: string[] = [];
    public triggerType: string = 'edge';
    public popoverCtrl: PopoverController;
    public showTriggerSettings: boolean = true;
    public devMngSrv: DeviceManagerService;
    public activeDevice: DeviceService;
    public ignoreFocusOut: boolean = false;

    public tutorialMode: boolean = false;
    public tutorialStage: 'idle' | 'level' | 'type' = 'idle';
    public bitmask: string = '';

    constructor(
        _popoverCtrl: PopoverController,
        _devMngSrv: DeviceManagerService,
        _tooltipService: TooltipService,
        _toastService: ToastService,
        public deviceDataTransferService: DeviceDataTransferService
    ) {
        this.popoverCtrl = _popoverCtrl;
        this.tooltipService = _tooltipService;
        this.toastService = _toastService;
        this.devMngSrv = _devMngSrv;
        this.activeDevice = this.devMngSrv.devices[this.devMngSrv.activeDeviceIndex];
        for (let i = 0; i < this.activeDevice.instruments.osc.numChans; i++) {
            this.triggerSources.push('Osc Ch ' + (i + 1));
        }
        for (let i = 0; i < this.activeDevice.instruments.la.numChans; i++) {
            this.triggerSources.push('LA');
        }
        for (let i = 0; i < this.activeDevice.instruments.la.chans[0].numDataBits; i++) {
            this.bitmask += 'x';
        }
    }

    endTutorial() {
        this.tutorialMode = false;
        this.tutorialStage = 'idle';
        this.triggerTutotrialFinish.emit('trigger tutorial finished');
    }

    startTutorial() {
        this.tutorialMode = true;
        this.tutorialStage = 'level';
    }
    
    tutorialToEdge() {
        this.tutorialStage = 'type';
    }

    initializeFromGetStatus(getStatusObject: any) {
        for (let channel in getStatusObject.trigger) {
            getStatusObject.trigger[channel].forEach((val, index, array) => {
                if (val.source != undefined && val.source.instrument === 'osc') {
                    this.triggerSource = 'Osc Ch ' + val.source.channel;
                    this.deviceDataTransferService.triggerSource = this.triggerSource;
                    this.dropPopSource.setActiveSelection(this.triggerSource);
                }
                else if (val.source != undefined && val.source.instrument === 'la') {
                    this.triggerSource = 'LA';
                    this.deviceDataTransferService.triggerSource = this.triggerSource;
                    this.dropPopSource.setActiveSelection(this.triggerSource);
                    if (val.source.risingEdge != undefined && val.source.fallingEdge != undefined) {
                        this.translateSeparateBitmasks(val.source.risingEdge, val.source.fallingEdge, this.activeDevice.instruments.la.chans[0].numDataBits);
                    }
                }
                if (val.source != undefined) {
                    if (val.source.type != undefined) {
                        this.edgeDirection = val.source.type === 'risingEdge' ? 'rising' : 'falling';
                    }
                    else if (val.source.instrument === 'force') {
                        this.edgeDirection = 'off';
                    }
                }
                if (val.source != undefined && val.source.lowerThreshold != undefined && val.source.upperThreshold != undefined) {
                    this.lowerThresh = (val.source.lowerThreshold).toString();
                    this.upperThresh = (val.source.upperThreshold).toString();
                    this.deviceDataTransferService.triggerLevel = val.source.upperThreshold / 1000;
                    console.log(this.lowerThresh, this.upperThresh, this.deviceDataTransferService.triggerLevel);
                    this.chart.chart.triggerRedrawOverlay();
                }
            });
        }
    }

    sourceSelect(event) {
        console.log(this.activeDevice);
        if (this.deviceDataTransferService.awgPower && event === 'LA' && this.activeDevice.rootUri !== 'local') {
            this.toastService.createToast('awgOnNoLa');
            this.dropPopSource._applyActiveSelection(this.triggerSource);
            return;
        }
        this.triggerSource = event;
        this.deviceDataTransferService.triggerSource = this.triggerSource;
        this.chart.chart.triggerRedrawOverlay();
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
        else if (value.indexOf('k') !== -1 || value.indexOf('K') !== -1) {
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
            this.deviceDataTransferService.triggerLevel = 0;
            this.chart.chart.triggerRedrawOverlay();
            return;
        }
        if (this.deviceDataTransferService.triggerLevel === trueValue) {
            console.log('the same');
            this.deviceDataTransferService.triggerLevel = trueValue * 10 + 1;
            setTimeout(() => {
                this.deviceDataTransferService.triggerLevel = trueValue;
                this.chart.chart.triggerRedrawOverlay();
                this.upperThresh = (this.deviceDataTransferService.triggerLevel * 1000).toString();
                this.lowerThresh = (parseFloat(this.upperThresh) - 30).toString();
            }, 1);
            return;
        }
        this.deviceDataTransferService.triggerLevel = trueValue;
        this.upperThresh = (this.deviceDataTransferService.triggerLevel * 1000).toString();
        this.lowerThresh = (parseFloat(this.upperThresh) - 30).toString();
        this.chart.chart.triggerRedrawOverlay();
        console.log(this.upperThresh, this.lowerThresh);
    }

    getThresholdsInMillivolts() {
        return {
            upperThreshold: Math.round(this.deviceDataTransferService.triggerLevel * 1000),
            lowerThreshold: Math.round(this.deviceDataTransferService.triggerLevel * 1000 - 30)
        };
    }

    toggleTriggerShow() {
        this.showTriggerSettings = !this.showTriggerSettings;
    }

    forceTrigger() {
        this.activeDevice.instruments.trigger.forceTrigger([1]).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
                if (err.trigger && err.trigger["1"][0].statusCode === 2684354590) {
                    this.toastService.createToast('triggerForceNotArmed');
                    return;
                }
                this.toastService.createToast('triggerForceError', true);
            },
            () => { }
        );
    }

    setTrigType(type: 'rising' | 'falling' | 'off') {
        this.edgeDirection = type;
    }

    openLaPopover(event) {
        let popover = this.popoverCtrl.create(LaPopover, {
            bitmask: this.bitmask
        }, {
            enableBackdropDismiss: false
        });
        popover.onWillDismiss((data) => {
            console.log(data);
            if (data == undefined) { return; }
            if (data.bitmask) {
                this.bitmask = data.bitmask;
            }
        });
        popover.present({
            ev: event
        });
    }

    private translateSeparateBitmasks(risingBitmask: number, fallingBitmask: number, length: number) {
        this.bitmask = '';
        let rising = risingBitmask.toString(2);
        let falling = fallingBitmask.toString(2);
        console.log(rising, falling);
        let maxLength = Math.max(rising.length, falling.length);
        for (let i = 0; i < maxLength; i++) {
            let risingChar = rising.charAt(rising.length - i - 1);
            let fallingChar = falling.charAt(falling.length - i - 1);
            console.log(risingChar, fallingChar)
            if (risingChar && fallingChar) {
                if (risingChar === '1' && fallingChar === '1') {
                    this.bitmask = 'e' + this.bitmask;
                }
                else if (risingChar === '1') {
                    this.bitmask = 'r' + this.bitmask;
                }
                else if (fallingChar === '1') {
                    this.bitmask = 'f' + this.bitmask;
                }
                else {
                    this.bitmask = 'x' + this.bitmask;
                }
            }
            else if (risingChar) {
                if (risingChar === '1') {
                    this.bitmask = 'r' + this.bitmask;
                }
                else {
                    this.bitmask = 'x' + this.bitmask;
                }
            }
            else {
                if (fallingChar === '1') {
                    this.bitmask = 'f' + this.bitmask;
                }
                else {
                    this.bitmask = 'x' + this.bitmask;
                }
            }
        }
        let paddingString = '';
        for (let i = 0; i < length - this.bitmask.length; i++) {
            paddingString += 'x';
        }
        this.bitmask = paddingString + this.bitmask;
        console.log(this.bitmask);
    }

    getRisingBitmask() {
        let risingBitmaskString = '';
        for (let i = 0; i < this.bitmask.length; i++) {
            switch (this.bitmask.charAt(i)) {
                case 'e':
                    risingBitmaskString += '1';
                    break;
                case 'r':
                    risingBitmaskString += '1';
                    break;
                default:
                    risingBitmaskString += '0';
            }
        }
        return parseInt(risingBitmaskString, 2);
    }

    getFallingBitmask() {
        let fallingBitmaskString = '';
        for (let i = 0; i < this.bitmask.length; i++) {
            switch (this.bitmask.charAt(i)) {
                case 'e':
                    fallingBitmaskString += '1';
                    break;
                case 'f':
                    fallingBitmaskString += '1';
                    break;
                default:
                    fallingBitmaskString += '0';
            }
        }
        return parseInt(fallingBitmaskString, 2);
    }

}
