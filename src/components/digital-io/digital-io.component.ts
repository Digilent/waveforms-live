import { Component, Output, EventEmitter, Input } from '@angular/core';
import { AlertController, PopoverController } from 'ionic-angular';

//Components
import { DeviceComponent } from '../device/device.component';
import { SilverNeedleChart } from '../chart/chart.component';

//Services
import { DeviceManagerService } from '../../services/device/device-manager.service';
import { ToastService } from '../../services/toast/toast.service';
import { TooltipService } from '../../services/tooltip/tooltip.service';

@Component({
    templateUrl: 'digital-io.html',
    selector: 'digital-io'
})
export class DigitalIoComponent {
    @Output() headerClicked: EventEmitter<any> = new EventEmitter();
    @Input() contentHidden: boolean;
    @Input() chart: SilverNeedleChart;
    public alertCtrl: AlertController;
    public toastService: ToastService;
    public tooltipService: TooltipService;
    public deviceManagerService: DeviceManagerService;
    public activeDev: DeviceComponent;
    public gpioChans: number[] = [];
    public laChans: number[] = [];
    public laActiveChans: boolean[] = [];
    public gpioVals: boolean[] = [];
    public popoverCtrl: PopoverController;
    public gpioDirections: boolean[] = [];
    public showDigiContent: boolean = true;
    public selectedMode: string = 'io';
    public directionMode: boolean = false;

    constructor(
        _alertCtrl: AlertController,
        _tooltipService: TooltipService,
        _devManagerService: DeviceManagerService,
        _popoverCtrl: PopoverController,
        _toastService: ToastService
    ) {
        this.alertCtrl = _alertCtrl;
        this.toastService = _toastService;
        this.tooltipService = _tooltipService;
        this.popoverCtrl = _popoverCtrl;
        this.deviceManagerService = _devManagerService;
        this.activeDev = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
        for (let i = 0; i < this.activeDev.instruments.gpio.numChans; i++) {
            this.gpioChans.push(i + 1);
            this.gpioVals.push(false);
            this.gpioDirections.push(false);
        }
        for (let i = 0; i < this.activeDev.instruments.la.numChans; i++) {
            this.laChans.push(i + 1);
            this.laActiveChans.push(false);
        }
        this.contentHidden = true;
    }

    emitEvent() {
        this.headerClicked.emit(null);
    }

    getChannelTooltip(channel: number, state: 'analyzer' | 'gpio' | 'direction') {
        let buttonState = this.getButtonState(channel);
        let mode = 'Input';
        if (buttonState === 'A') {
            mode = 'Analyzer';
        }
        else if (buttonState === 'O') {
            mode = 'Output';
        }
        
        if (state === 'analyzer') {
            if (buttonState === 'I' || buttonState === 'O') {
                return 'Mode: ' + mode + '. Click to change to analyzer';
            }
            return 'Mode: ' + mode + '. Click to change to input';
        }
        else if (state === 'gpio') {
            if (buttonState === 'I') {
                return 'Mode: ' + mode + '. Value: ' + (this.gpioVals[channel] ? 'High' : 'Low');
            }
            else if (buttonState === 'A') {
                return 'Mode: ' + mode;
            }
            return 'Mode: ' + mode + '. Click to toggle ' + (this.gpioVals[channel] ? 'Low' : 'High');
        }
        else {
            if (buttonState === 'I' || buttonState === 'A') {
                return 'Mode: ' + mode + '. Click to change to output';
            }
            return 'Mode: ' + mode + '. Click to change to input';
        }
    }

    setAll(direction: 'output' | 'input') {
        let chanArray = [];
        let valArray = [];
        for (let i = 0; i < this.gpioChans.length; i++) {
            chanArray.push(i + 1);
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
        this.activeDev.instruments.gpio.setParameters([channel + 1], [direction]).subscribe(
            (data) => {

            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
        this.laActiveChans[channel] = false;
    }

    setMode(mode: string) {
        if (mode === 'analyzer' && this.activeDev.rootUri !== 'local') {
            this.toastService.createToast('notImplemented', true);
            this.selectedMode = 'io';
            return;
        }
        this.selectedMode = mode;
    }

    toggleChannel(channel: number) {
        this.gpioVals[channel] = !this.gpioVals[channel];
        let value = 0;
        if (this.gpioVals[channel] === true) {
            value = 1;
        }
        this.activeDev.instruments.gpio.write([channel + 1], [value]).subscribe(
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
        this.laActiveChans[channel] = !this.laActiveChans[channel];
        this.gpioDirections[channel] = false;
        this.gpioVals[channel] = false;
        let seriesNum = channel + this.chart.oscopeChansActive.length;
        this.chart.toggleVisibility(seriesNum);
    }

    getButtonState(channel: number) {
        if (this.laActiveChans[channel]) {
            return 'A';
        }
        else if (this.gpioDirections[channel]) {
            return 'O';
        }
        return 'I';
    }

    readAllIo(event) {
        let inputChans = [];
        for (let i = 0; i < this.gpioChans.length; i++) {
            if (this.gpioDirections[i] !== true && this.laActiveChans[i] !== true) {
                inputChans.push(i + 1);
            }
        }
        if (inputChans.length < 1) { return; }
        this.activeDev.instruments.gpio.read(inputChans).subscribe(
            (data) => {
                for (let channel in data.gpio) {
                    this.gpioVals[parseInt(channel) - 1] = data.gpio[channel][0].value === 1 ? true : false;
                }
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }
}