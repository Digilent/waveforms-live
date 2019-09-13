import { Component, Output, EventEmitter, Input } from '@angular/core';
import { AlertController, PopoverController } from 'ionic-angular';

//Components
import { InstrumentPanelChart } from '../instrument-panel-chart/instrument-panel-chart.component';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';
import { ToastService } from '../../services/toast/toast.service';
import { TooltipService } from '../../services/tooltip/tooltip.service';
import { DeviceDataTransferService } from '../../services/device/device-data-transfer.service';

@Component({
    templateUrl: 'digital-io.html',
    selector: 'digital-io'
})
export class DigitalIoComponent {
    @Output() headerClicked: EventEmitter<any> = new EventEmitter();
    @Input() contentHidden: boolean;
    @Input() chart: InstrumentPanelChart;
    public alertCtrl: AlertController;
    public toastService: ToastService;
    public tooltipService: TooltipService;
    public deviceManagerService: DeviceManagerService;
    public activeDev: DeviceService;
    public gpioChans: number[] = [];
    public laChans: number[] = [];
    public laActiveChans: boolean[] = [];
    public gpioVals: boolean[] = [];
    public popoverCtrl: PopoverController;
    public gpioDirections: boolean[] = [];
    public showDigiContent: boolean = true;
    public selectedMode: string = 'io';
    public directionMode: boolean = false;
    public isLogger: boolean = false;

    constructor(
        _alertCtrl: AlertController,
        _tooltipService: TooltipService,
        _devManagerService: DeviceManagerService,
        _popoverCtrl: PopoverController,
        _toastService: ToastService,
        public dataTransferService: DeviceDataTransferService
    ) {
        this.alertCtrl = _alertCtrl;
        this.toastService = _toastService;
        this.tooltipService = _tooltipService;
        this.popoverCtrl = _popoverCtrl;
        this.deviceManagerService = _devManagerService;
        this.activeDev = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];

        this.isLogger = this.activeDev.deviceModel === 'OpenLogger MZ';
        
        for (let i = 0; i < this.activeDev.instruments.gpio.numChans; i++) {
            this.gpioChans.push((this.isLogger) ? i : i + 1);
            this.gpioVals.push(false);
            this.gpioDirections.push(false);
        }
        
        for (let i = 0; i < this.activeDev.instruments.la.numChans; i++) {
            let chanNum: number = 0;

            for (let j = 0; j < this.activeDev.instruments.la.chans[i].numDataBits; j++) {
                chanNum++;
                this.laChans.push(chanNum);
                this.laActiveChans.push(false);
            }

            this.dataTransferService.laChanActive = false;
        }
        this.contentHidden = true;

        if (this.isLogger) this.getCurrentState();
    }

    emitEvent() {
        this.headerClicked.emit(null);
    }

    getChannelTooltip(channel: number, state: 'analyzer' | 'gpio' | 'direction') {
        let buttonState: ButtonState = this.getButtonState(channel);
        let mode = 'Input';
        if (buttonState === 'A') {
            mode = 'Analyzer';
        }
        else if (buttonState === 'Out') {
            mode = 'Output';
        }
        
        if (state === 'analyzer') {
            if (buttonState === 'In' || buttonState === 'Out') {
                return 'Mode: ' + mode + '. Click to change to analyzer';
            }
            return 'Mode: ' + mode + '. Click to change to input';
        }
        else if (state === 'gpio') {
            if (buttonState === 'In') {
                return 'Mode: ' + mode + '. Value: ' + (this.gpioVals[channel] ? 'High' : 'Low');
            }
            else if (buttonState === 'A') {
                return 'Mode: ' + mode;
            }
            return 'Mode: ' + mode + '. Click to toggle ' + (this.gpioVals[channel] ? 'Low' : 'High');
        }
        else {
            if (buttonState === 'In' || buttonState === 'A') {
                return 'Mode: ' + mode + '. Click to change to output';
            }
            return 'Mode: ' + mode + '. Click to change to input';
        }
    }

    setAll(direction: 'output' | 'input') {
        let chanArray = [];
        let valArray = [];
        for (let i = 0; i < this.gpioChans.length; i++) {
            chanArray.push((this.isLogger) ? i : i + 1);
            valArray.push(direction);
        }
        this.activeDev.instruments.gpio.setParameters(chanArray, valArray).subscribe(
            (data) => {
                console.log('set direction');
            },
            (err) => {
                console.log(err);
            },
            () => {
                
            }
        );
    }

    toggleDigiSettings() {
        this.showDigiContent = !this.showDigiContent;
    }

    toggleDirectionMode() {
        this.directionMode = !this.directionMode;
        if (this.directionMode) {
            this.toastService.createToast('selectOutput');
        }
    }

    toggleChanDirection(channel: number) {
        this.gpioDirections[channel] = !this.gpioDirections[channel];
        let direction = this.gpioDirections[channel] === true ? 'output' : 'input';
        this.activeDev.instruments.gpio.setParameters([(this.isLogger) ? channel : channel + 1], [direction]).subscribe(
            (data) => {

            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
        this.laActiveChans[channel] = false;
        this.dataTransferService.laChanActive = this.laActiveChans.indexOf(true) !== -1;
    }

    setMode(mode: string) {
        this.selectedMode = mode;
    }

    toggleChannel(channel: number) {
        this.gpioVals[channel] = !this.gpioVals[channel];
        let value = 0;
        if (this.gpioVals[channel] === true) {
            value = 1;
        }
        this.activeDev.instruments.gpio.write([(this.isLogger) ? channel : channel + 1], [value]).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );

    }

    toggleLaChan(channel: number) {
        if (this.dataTransferService.awgPower && !this.laActiveChans[channel] && this.activeDev.transport.getType() !== 'local') {
            this.toastService.createToast('awgOnNoLa', true);
            return; 
        }
        this.laActiveChans[channel] = !this.laActiveChans[channel];
        this.gpioDirections[channel] = false;
        this.gpioVals[channel] = false;
        let seriesNum = channel + this.chart.oscopeChansActive.length;
        this.chart.toggleVisibility(seriesNum);
        this.dataTransferService.laChanActive = this.laActiveChans.indexOf(true) !== -1;
    }

    getButtonState(channel: number): ButtonState {
        if (this.laActiveChans[channel]) {
            return 'A';
        }
        else if (this.gpioDirections[channel]) {
            return 'Out';
        }
        return 'In';
    }

    readAllIo(event) {
        let inputChans = [];
        for (let i = 0; i < this.gpioChans.length; i++) {
            if (this.gpioDirections[i] !== true) {
                (this.isLogger) ? inputChans.push(i) : inputChans.push(i + 1); // OpenLogger doesn't refer to the channels this way :/
            }
        }

        if (inputChans.length < 1) { return; }

        this.activeDev.instruments.gpio.read(inputChans).subscribe(
            (data) => {
                for (let channel in data.gpio) {
                    this.gpioVals[(this.isLogger) ? parseInt(channel) : parseInt(channel) - 1] = data.gpio[channel][0].value === 1 ? true : false;
                }
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    getCurrentState() {
        if (this.gpioChans.length < 1) {
            return;
        }

        this.activeDev.instruments.gpio.getCurrentState(this.gpioChans).subscribe(
            (data) => {
                for (let channel in data.gpio) {
                    const { direction, value } = data.gpio[channel][0];

                    this.gpioVals[(this.isLogger) ? parseInt(channel) : parseInt(channel) - 1] = value === 1 ? true : false;
                    this.gpioDirections[(this.isLogger) ? parseInt(channel) : parseInt(channel) - 1] = direction === 'output' ? true : false;
                }
            },
            (err) => {

            },
            () => {}
        );
    }
}

export type ButtonState = 'A' | 'In' | 'Out';