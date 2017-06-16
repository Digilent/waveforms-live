import { Component, Output, EventEmitter } from '@angular/core';
import { ModalController, PopoverController } from 'ionic-angular';

//Components
import { GenPopover } from '../../components/gen-popover/gen-popover.component';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';
import { SettingsService } from '../../services/settings/settings.service';
import { ToastService } from '../../services/toast/toast.service';
import { TooltipService } from '../../services/tooltip/tooltip.service';
import { DeviceDataTransferService } from '../../services/device/device-data-transfer.service';

//Interfaces
import { SettingsObject } from 'dip-angular2/services';

const enum TutorialStage {
    IDLE,
    LOOPBACK,
    WAVETYPE,
    POWER
}

@Component({
    templateUrl: 'function-gen.html',
    selector: 'fgen'
})
export class FgenComponent {
    @Output() fgenTutorialFinish: EventEmitter<any> = new EventEmitter();
    public settingsService: SettingsService;
    public tooltipService: TooltipService;
    public showDutyCycle: boolean;
    public waveType: string;
    public frequency: number;
    public amplitude: number;
    public offset: number;
    public dutyCycle: number;
    public powerOn: boolean;
    public deviceManagerService: DeviceManagerService;
    public activeDevice: DeviceService;
    public supportedSignalTypes: string[];
    public attemptingPowerOff: boolean = false;
    public modalCtrl: ModalController;
    public popoverCtrl: PopoverController;
    public toastService: ToastService;
    public showSettings: boolean = true;
    public showChanSettings: boolean[] = [true];
    public ignoreFocusOut: boolean = false;
    public tutorialStage: TutorialStage = TutorialStage.IDLE;
    public tutorialMode: boolean = false;
    public awaitingResponse: boolean = false;

    constructor(
        _deviceManagerService: DeviceManagerService,
        _modalCtrl: ModalController,
        _popoverCtrl: PopoverController,
        _toastService: ToastService,
        _settingsService: SettingsService,
        _tooltipService: TooltipService,
        public dataTransferService: DeviceDataTransferService
    ) {
        this.settingsService = _settingsService;
        this.tooltipService = _tooltipService;
        this.modalCtrl = _modalCtrl;
        this.popoverCtrl = _popoverCtrl;
        this.toastService = _toastService;
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.getActiveDevice();
        this.supportedSignalTypes = this.activeDevice.instruments.awg.chans[0].signalTypes;
        for (let i = 0; i < this.activeDevice.instruments.awg.numChans - 1; i++) {
            this.showChanSettings.push(false);
        }
        this.showDutyCycle = false;
        this.waveType = 'sine';
        this.frequency = 1000;
        this.amplitude = 3;
        this.offset = 0;
        this.dutyCycle = 50;
        this.powerOn = false;
        this.dataTransferService.awgPower = false;
    }

    initializeValues() {
        this.powerOn = false;
        this.dataTransferService.awgPower = false;
        this.frequency = 1000;
        this.amplitude = 3;
        this.offset = 0;
        this.waveType = 'sine';
    }

    initializeFromGetStatus(getStatusObject: any) {
        for (let channel in getStatusObject.awg) {
            getStatusObject.awg[channel].forEach((val, index, array) => {
                if (val.state != undefined) {
                    this.powerOn = val.state === 'running';
                    this.dataTransferService.awgPower = this.powerOn;
                }
                if (val.waveType != undefined && val.waveType !== 'none') {
                    this.waveType = val.waveType;
                }
                if (val.actualSignalFreq != undefined && val.waveType !== 'none') {
                    this.frequency = val.actualSignalFreq / 1000;
                }
                if (val.actualVpp != undefined && val.waveType !== 'none') {
                    this.amplitude = val.actualVpp / 1000;
                }
                if (val.actualVOffset != undefined && val.waveType !== 'none') {
                    this.offset = val.actualVOffset / 1000;
                }
            });
        }
    }

    startTutorial() {
        this.tutorialMode = true;
        this.tutorialStage = TutorialStage.LOOPBACK;
    }

    finishTutorial() {
        this.fgenTutorialFinish.emit('Fgen Tutorial Finished');
        this.tutorialMode = false;
        this.tutorialStage = TutorialStage.IDLE;
    }

    highlightPower() {
        this.tutorialStage = TutorialStage.POWER;
        console.log(this.tutorialStage);
    }

    checkForEnter(event, input: string) {
        if (event.key === 'Enter') {
            this.formatInputAndUpdate(event, input);
            this.ignoreFocusOut = true;
        }
    }

    getAwgStates() {
        let chans = [];
        for (let i = 0; i < this.activeDevice.instruments.awg.numChans; i++) {
            chans.push(i + 1);
        }
        this.activeDevice.instruments.awg.getCurrentState(chans).subscribe(
            (data) => {
                console.log(data);
                for (let channel in data.awg) {
                    this.powerOn = data.awg[channel][0].state === 'running';
                    this.dataTransferService.awgPower = this.powerOn;
                }
                if (this.powerOn) {
                    this.waveType = data.awg['1'][0].waveType;
                    this.frequency = data.awg['1'][0].actualSignalFreq / 1000;
                    this.amplitude = data.awg['1'][0].actualVpp / 1000;
                    this.offset = data.awg['1'][0].actualVOffset / 1000;
                }
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    proceedToNextStage() {
        this.tutorialStage = TutorialStage.WAVETYPE;
    }

    inputLeave(event, input: string) {
        if (!this.ignoreFocusOut) {
            this.formatInputAndUpdate(event, input);
        }
        this.ignoreFocusOut = false;
    }

    formatInputAndUpdate(event, input: string) {
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
        switch (input) {
            case 'frequency':
                if (trueValue < this.activeDevice.instruments.awg.chans[0].signalFreqMin / 1000) {
                    trueValue = this.activeDevice.instruments.awg.chans[0].signalFreqMin / 1000;
                }
                else if (trueValue > this.activeDevice.instruments.awg.chans[0].signalFreqMax / 1000) {
                    trueValue = this.activeDevice.instruments.awg.chans[0].signalFreqMax / 1000;
                }
                if (this.frequency === trueValue) {
                    console.log('the same');
                    this.frequency = trueValue * 10 + 1;
                    setTimeout(() => {
                        this.frequency = trueValue;
                    }, 1);
                    return;
                }
                this.frequency = trueValue;
                break;
            case 'amplitude':
                trueValue = Math.abs(trueValue);
                let mid = (this.activeDevice.instruments.awg.chans[0].vOutMax + this.activeDevice.instruments.awg.chans[0].vOutMin) / 2000;
                console.log(mid);
                if (this.offset >= mid) {
                    if ((trueValue / 2) + this.offset > this.activeDevice.instruments.awg.chans[0].vOutMax / 1000) {
                        trueValue = 2 * Math.abs((this.activeDevice.instruments.awg.chans[0].vOutMax / 1000) - this.offset);
                    }
                }
                else {
                    if (this.offset - (trueValue / 2) < this.activeDevice.instruments.awg.chans[0].vOutMin / 1000) {
                        trueValue = 2 * Math.abs((this.activeDevice.instruments.awg.chans[0].vOutMin / 1000) - this.offset);
                    }
                }
                if (this.amplitude === trueValue) {
                    console.log('the same');
                    this.amplitude = trueValue * 10 + 1;
                    setTimeout(() => {
                        this.amplitude = trueValue;
                    }, 1);
                    return;
                }
                this.amplitude = trueValue;
                break;
            case 'offset':
                if (trueValue < this.activeDevice.instruments.awg.chans[0].vOffsetMin / 1000) {
                    trueValue = this.activeDevice.instruments.awg.chans[0].vOffsetMin / 1000;
                }
                else if (trueValue > this.activeDevice.instruments.awg.chans[0].vOffsetMax / 1000) {
                    trueValue = this.activeDevice.instruments.awg.chans[0].vOffsetMax / 1000;
                }
                if (this.offset === trueValue) {
                    console.log('the same');
                    this.offset = trueValue * 10 + 1;
                    setTimeout(() => {
                        this.offset = trueValue;
                    }, 1);
                    return;
                }
                this.offset = trueValue;
                break;
            case 'dutyCycle':
                if (trueValue < 0) {
                    trueValue = 0;
                }
                else if (trueValue > 100) {
                    trueValue = 100;
                }
                if (this.dutyCycle === trueValue) {
                    console.log('the same');
                    this.dutyCycle = trueValue * 10 + 1;
                    setTimeout(() => {
                        this.dutyCycle = trueValue;
                    }, 1);
                    return;
                }
                this.dutyCycle = trueValue;
                break;
            default:
        }
    }

    //Toggle dropdown
    toggleWave(waveType: string) {
        if (this.powerOn) {
            return;
        }
        this.waveType = waveType;
        if (this.tutorialMode) {
            this.highlightPower();
        }
    }

    toggleChanSettings(channel: number) {
        this.showChanSettings[channel] = !this.showChanSettings[channel];
    }

    toggleAwgSettings() {
        this.showSettings = !this.showSettings;
    }

    frequencyMousewheel(event) {
        if (this.powerOn) { return; }
        if (event.deltaY < 0) {
            this.incrementFrequency();
        }
        else {
            this.decrementFrequency();
        }
    }

    voltageMousewheel(event, type: 'amplitude' | 'offset') {
        if (this.powerOn) { return; }
        if (event.deltaY < 0) {
            type === 'amplitude' ? this.incrementAmplitude() : this.incrementOffset();
        }
        else {
            type === 'amplitude' ? this.decrementAmplitude() : this.decrementOffset();
        }
    }

    incrementAmplitude() {
        let newAmp = this.amplitude + 0.1;
        this.amplitude = Math.min(newAmp, this.activeDevice.instruments.awg.chans[0].dacVpp / 1000);
    }

    decrementAmplitude() {
        let newAmp = this.amplitude - 0.1;
        this.amplitude = Math.max(newAmp, 0);
    }

    incrementOffset() {
        let newOffset = this.offset + 0.1;
        this.offset = Math.min(newOffset, this.activeDevice.instruments.awg.chans[0].vOffsetMax / 1000);
    }

    decrementOffset() {
        let newOffset = this.offset - 0.1;
        this.offset = Math.max(newOffset, this.activeDevice.instruments.awg.chans[0].vOffsetMin / 1000);
    }

    incrementFrequency() {
        let valString = this.frequency.toString();
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
        this.frequency = newFreq;
    }

    decrementFrequency() {
        let valString = this.frequency.toString();
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
        this.frequency = newFreq;
    }

    //Toggle power to awg
    togglePower(event) {
        this.awaitingResponse = true;
        if (this.tutorialMode) {
            this.finishTutorial();
        }
        let chans = [];
        let settings = [];
        for (let i = 0; i < this.activeDevice.instruments.awg.numChans; i++) {
            chans[i] = i + 1;
            settings[i] = {
                signalType: this.waveType,
                signalFreq: this.frequency,
                vpp: this.waveType === 'dc' ? 0 : this.amplitude,
                vOffset: this.offset
            };
        }
        if (!this.powerOn) {
            console.log(this.dataTransferService);
            if ((this.dataTransferService.laChanActive || this.dataTransferService.triggerSource === 'LA') && this.activeDevice.transport.getType() !== 'local') {
                this.toastService.createToast('laOnNoAwg');
                this.awaitingResponse = false;
                return;
            }
            let singleCommand = {
                awg: {
                    setRegularWaveform: [chans, settings],
                    run: [chans]
                }
            }
            this.activeDevice.multiCommand(singleCommand).subscribe(
                (data) => {
                    console.log(data);
                    if (data.command && data.command == 'setRegularWaveform') {
                        this.frequency = data.actualSignalFreq / 1000;
                    }
                    this.awaitingResponse = false;
                },
                (err) => {
                    console.log(err);
                    this.awaitingResponse = false;
                    console.log('AWG Set Regular and Run Failed');
                    this.stop(chans);
                    this.toastService.createToast('awgRunError', true);
                },
                () => {
                    //console.log('multi command awg complete');
                    this.powerOn = !this.powerOn;
                    this.dataTransferService.awgPower = this.powerOn;
                }
            );
        }
        else {
            this.stop(chans);
        }
    }

    //Get settings from awg
    setArbitraryWaveform(chans: number[], waveforms, dataTypes: string[]) {
        /*this.activeDevice.instruments.awg.setArbitraryWaveform(chans, waveforms, ['I16']).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log('AWG Set Arbitrary Failed');
            },
            () => {

            });*/
    }

    //Set regular waveform for awg
    setRegularWaveform(chans: number[], settings: Array<SettingsObject>) {
        this.activeDevice.instruments.awg.setRegularWaveform(chans, settings).subscribe(
            (data) => {
                //console.log(data);
            },
            (err) => {
                console.log('AWG Set Regular Failed');
                this.stop(chans);
                this.toastService.createToast('awgParamError', true);
            },
            () => {

            });
    }

    //Stop awg
    stop(chans: number[]) {
        this.awaitingResponse = true;
        this.activeDevice.instruments.awg.stop(chans).subscribe(
            (data) => {
                this.awaitingResponse = false;
                //console.log(data);
                this.powerOn = false;
                this.dataTransferService.awgPower = false;
                if (data.awg['1'][0].statusCode === 0 && this.attemptingPowerOff) {
                    this.attemptingPowerOff = false;
                    this.toastService.createToast('awgRunError', true);
                }
            },
            (err) => {
                this.awaitingResponse = false;
                console.log('AWG Stop Failed');
            },
            () => {

            });
    }

    openPopover(event) {
        let genPopover = this.popoverCtrl.create(GenPopover, {
            dataArray: this.supportedSignalTypes
        });
        genPopover.present({
            ev: event
        });
        genPopover.onWillDismiss(data => {
            this.toggleWave(data.option);
        });
    }

    //Determines if active wave type is a square wave
    isSquare() {
        if (this.waveType === 'square') {
            return true;
        }
        return false;
    }

}
