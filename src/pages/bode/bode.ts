import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

//Components
import { BodePlotComponent } from '../../components/bode-plot/bode-plot.component';

//Services
import { UtilityService } from '../../services/utility/utility.service';
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';
import { ToastService } from '../../services/toast/toast.service';

//Interfaces
import { SweepType } from '../../components/bode-plot/bode-plot.component';

@Component({
    templateUrl: "bode.html"
})
export class BodePage {
    @ViewChild('bodeComponent') bodeComponent: BodePlotComponent;
    public navCtrl: NavController;
    public startFreq: number = 100;
    public stopFreq: number = 10000;
    public stepsPerDec: string = '10';
    public ignoreFocusOut: boolean = false;
    public sweepType: SweepType = 'Log';
    public sweepTypeArray: SweepType[] = ['Log', 'Linear'];
    public vertScale: SweepType = 'Log';
    private activeDevice: DeviceService;
    private dismissCallback: () => void;

    constructor(
        _navCtrl: NavController,
        private utilityService: UtilityService,
        private deviceManagerService: DeviceManagerService,
        private toastService: ToastService,
        private navParams: NavParams
    ) {
        this.navCtrl = _navCtrl;
        this.dismissCallback = this.navParams.get('onBodeDismiss');
        this.activeDevice = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
    }

    select(event, type: 'vert' | 'sweep') {
        if (type === 'sweep') {
            this.sweepType = event;
        }
        else if (type === 'vert') {
            this.vertScale = event;
            if (this.vertScale === 'Log') {
                this.bodeComponent.transformToLog('y');
            }
            else if (this.vertScale === 'Linear') {
                this.bodeComponent.transformToLinear('y');
            }
        }
    }
    
    checkForEnter(event, input: BodeInput) {
        if (event.key === 'Enter') {
            this.formatInputAndUpdate(event, input);
            this.ignoreFocusOut = true;
        }
    }

    inputLeave(event, input: BodeInput) {
        if (!this.ignoreFocusOut) {
            this.formatInputAndUpdate(event, input);
        }
        this.ignoreFocusOut = false;
    }

    frequencyMousewheel(event, input: BodeInput) {
        if (event.deltaY < 0) {
            this.incrementFrequency(input);
        }
        else {
            this.decrementFrequency(input);
        }
    }

    stepMousewheel(event) {
        if (event.deltaY < 0) {
            if (parseInt(this.stepsPerDec) >= 40) { return; }
            this.stepsPerDec = (parseInt(this.stepsPerDec) + 1).toString();
        }
        else {
            if (parseInt(this.stepsPerDec) <= 1) { return; }
            this.stepsPerDec = (parseInt(this.stepsPerDec) - 1).toString();
        }
    }

    incrementFrequency(input: BodeInput) {
        let min = this.activeDevice.instruments.awg.chans[0].signalFreqMin / 1000;
        let max = this.activeDevice.instruments.awg.chans[0].signalFreqMax / 1000;
        max = Math.min(max, this.activeDevice.instruments.osc.chans[0].sampleFreqMax / 1000 / 10);
        let valString;
        if (input === 'startFreq') {
            valString = this.startFreq.toString();
        }
        else if (input === 'stopFreq') {
            valString = this.stopFreq.toString();
        }
        let leadingNum = parseInt(valString.charAt(0), 10);
        let numberMag = valString.split('.')[0].length - 1;
        leadingNum++;
        if (leadingNum === 10) {
            leadingNum = 1;
            numberMag++;
        }
        let newFreq = leadingNum * Math.pow(10, numberMag);
        if (newFreq < this.activeDevice.instruments.awg.chans[0].signalFreqMin / 1000) {
            newFreq = this.activeDevice.instruments.awg.chans[0].signalFreqMin / 1000;
        }
        else if (newFreq > this.activeDevice.instruments.awg.chans[0].signalFreqMax / 1000) {
            newFreq = this.activeDevice.instruments.awg.chans[0].signalFreqMax / 1000;
        }
        if (input === 'startFreq') {
            this.startFreq = Math.min(Math.max(min, newFreq), max);
            if (this.startFreq > this.stopFreq) {
                this.stopFreq = this.startFreq;
            }
        }
        else if (input === 'stopFreq') {
            this.stopFreq = Math.min(Math.max(min, newFreq), max);
            if (this.stopFreq < this.startFreq) {
                this.startFreq = this.stopFreq;
            }
        }
    }

    decrementFrequency(input: BodeInput) {
        let min = this.activeDevice.instruments.awg.chans[0].signalFreqMin / 1000;
        let max = this.activeDevice.instruments.awg.chans[0].signalFreqMax / 1000;
        max = Math.min(max, this.activeDevice.instruments.osc.chans[0].sampleFreqMax / 1000 / 10);
        let valString;
        if (input === 'startFreq') {
            valString = this.startFreq.toString();
        }
        else if (input === 'stopFreq') {
            valString = this.stopFreq.toString();
        }
        let leadingNum = parseInt(valString.charAt(0), 10);
        let numberMag = valString.split('.')[0].length - 1;
        leadingNum--;
        if (leadingNum === 0) {
            leadingNum = 9;
            numberMag--;
        }
        let newFreq = leadingNum * Math.pow(10, numberMag);
        if (newFreq < this.activeDevice.instruments.awg.chans[0].signalFreqMin / 1000) {
            newFreq = this.activeDevice.instruments.awg.chans[0].signalFreqMin / 1000;
        }
        else if (newFreq > this.activeDevice.instruments.awg.chans[0].signalFreqMax / 1000) {
            newFreq = this.activeDevice.instruments.awg.chans[0].signalFreqMax / 1000;
        }
        if (input === 'startFreq') {
            this.startFreq = Math.min(Math.max(min, newFreq), max);
            if (this.startFreq > this.stopFreq) {
                this.stopFreq = this.startFreq;
            }
        }
        else if (input === 'stopFreq') {
            this.stopFreq = Math.min(Math.max(min, newFreq), max);
            if (this.stopFreq < this.startFreq) {
                this.startFreq = this.stopFreq;
            }
        }
    }

    formatInputAndUpdate(event, input:  BodeInput) {
        let min = this.activeDevice.instruments.awg.chans[0].signalFreqMin / 1000;
        let max = this.activeDevice.instruments.awg.chans[0].signalFreqMax / 1000;
        max = Math.min(max, this.activeDevice.instruments.osc.chans[0].sampleFreqMax / 1000 / 10);
        //The max frequency has to be 10x less than the max allowable so the sampling frequency can be 10x signal frequency 
        //for FFT step size to hit signal frequency perfectly 
        switch (input) {
            case 'startFreq':     
                this.startFreq = Math.min(Math.max(min, this.utilityService.parseBaseNumberVal(event)), max);
                if (this.startFreq > this.stopFreq) {
                    this.stopFreq = this.startFreq;
                }
                break;
            case 'stopFreq':            
                this.stopFreq = Math.min(Math.max(min, this.utilityService.parseBaseNumberVal(event)), max);
                if (this.stopFreq < this.startFreq) {
                    this.startFreq = this.stopFreq;
                }
                break;
            default:
        }
    }

    done() {
        if (this.dismissCallback != undefined) {
            this.dismissCallback();
        }
        this.navCtrl.pop();
    }

    start() {
        if (this.startFreq === this.stopFreq || this.startFreq > this.stopFreq) {
            this.toastService.createToast('bodeInvalidRange', true);
            return;
        }
        this.bodeComponent.startSweep(this.startFreq, this.stopFreq, parseInt(this.stepsPerDec), true, this.vertScale === 'Log', this.sweepType)
            .then((data) => {
                console.log(data);
            })
            .catch((e) => {
                console.log(e);
                if (e === 'interrupted') {
                    this.toastService.createToast('bodeAborted', true);
                }
            });
    }

}

export type BodeInput = 'startFreq' | 'stopFreq';