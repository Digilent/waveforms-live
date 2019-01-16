import { Component, Output, EventEmitter } from '@angular/core';

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
    public waveType: string[] = [];
    public frequency: number[] = [];
    public amplitude: number[] = [];
    public offset: number[] = [];
    public dutyCycle: number;
    public powerOn: boolean[] = [];
    public deviceManagerService: DeviceManagerService;
    public activeDevice: DeviceService;
    public supportedSignalTypes: string[];
    public attemptingPowerOff: boolean = false;
    public toastService: ToastService;
    public showSettings: boolean = true;
    public showChanSettings: boolean[] = [true];
    public tutorialStage: TutorialStage = TutorialStage.IDLE;
    public tutorialMode: boolean = false;
    public awaitingResponse: boolean = false;

    constructor(
        _deviceManagerService: DeviceManagerService,
        _toastService: ToastService,
        _settingsService: SettingsService,
        _tooltipService: TooltipService,
        public dataTransferService: DeviceDataTransferService
    ) {
        this.settingsService = _settingsService;
        this.tooltipService = _tooltipService;
        this.toastService = _toastService;
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.getActiveDevice();
        this.supportedSignalTypes = this.activeDevice.instruments.awg.chans[0].signalTypes;
        for (let i = 0; i < this.activeDevice.instruments.awg.numChans; i++) {
            this.showChanSettings.push(false);
            this.frequency.push(1000);
            this.amplitude.push(3);
            this.offset.push(0);
            this.waveType.push('sine');
            this.powerOn.push(false);
        }
        this.showDutyCycle = false;
        this.dutyCycle = 50;
        this.dataTransferService.awgPower = false;
    }

    initializeValues() {
        console.log('initializing function generator');

        this.dataTransferService.awgPower = false;

        for (let i = 0; i < this.activeDevice.instruments.awg.numChans; i++) {
            this.frequency[i] = 1000;
            this.amplitude[i] = 3;
            this.offset[i] = 0;
            this.waveType[i] = 'sine';
            this.powerOn[i] = false;
        }
    }

    initializeFromGetStatus(getStatusObject: any) {
        for (let channel in getStatusObject.awg) {
            getStatusObject.awg[channel].forEach((val, index, array) => {
                if (val.state != undefined) {
                    this.powerOn[index] = val.state === 'running';
                    this.dataTransferService.awgPower = this.powerOn[index];
                }

                if (val.waveType != undefined && val.waveType !== 'none') {
                    this.waveType[index] = val.waveType;
                }

                if (val.actualSignalFreq != undefined && val.waveType !== 'none') {
                    this.frequency[index] = val.actualSignalFreq / 1000;
                }

                if (val.actualVpp != undefined && val.waveType !== 'none') {
                    this.amplitude[index] = val.actualVpp / 1000;
                }

                if (val.actualVOffset != undefined && val.waveType !== 'none') {
                    this.offset[index] = val.actualVOffset / 1000;
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

    // getAwgStates() { // note(andrew): no idea how to get map the channels in the data.awg object to the channels the funGenerator keeps
    //     let chans = [];
    //     for (let i = 0; i < this.activeDevice.instruments.awg.numChans; i++) {
    //         chans.push(i + 1);
    //     }
    //     this.activeDevice.instruments.awg.getCurrentState(chans).subscribe(
    //         (data) => {
    //             console.log(data);
    //             for (let channel in data.awg) {
    //                 this.powerOn = data.awg[channel][0].state === 'running';
    //                 this.dataTransferService.awgPower = this.powerOn;
    //             }
    //             if (this.powerOn) {
    //                 this.waveType = data.awg['1'][0].waveType;
    //                 this.frequency = data.awg['1'][0].actualSignalFreq / 1000;
    //                 this.amplitude = data.awg['1'][0].actualVpp / 1000;
    //                 this.offset = data.awg['1'][0].actualVOffset / 1000;
    //             }
    //         },
    //         (err) => {
    //             console.log(err);
    //         },
    //         () => { }
    //     );
    // }

    proceedToNextStage() {
        this.tutorialStage = TutorialStage.WAVETYPE;
    }

    formatInputAndUpdate(trueValue: number, input: string, index: number) {
        console.log(trueValue);

        switch (input) {
            case 'frequency':
                if (trueValue < this.activeDevice.instruments.awg.chans[index].signalFreqMin / 1000) {
                    trueValue = this.activeDevice.instruments.awg.chans[index].signalFreqMin / 1000;
                }
                else if (trueValue > this.activeDevice.instruments.awg.chans[index].signalFreqMax / 1000) {
                    trueValue = this.activeDevice.instruments.awg.chans[index].signalFreqMax / 1000;
                }

                if (this.frequency[index] === trueValue) {
                    console.log('the same');

                    this.frequency[index] = trueValue * 10 + 1;

                    setTimeout(() => {
                        this.frequency[index] = trueValue;
                    }, 1);

                    return;
                }

                this.frequency[index] = trueValue;
                break;
            case 'amplitude':
                trueValue = Math.abs(trueValue);

                let mid = (this.activeDevice.instruments.awg.chans[index].vOutMax + this.activeDevice.instruments.awg.chans[index].vOutMin) / 2000;

                console.log(mid);

                if (this.offset[index] >= mid) {
                    if ((trueValue / 2) + this.offset[index] > this.activeDevice.instruments.awg.chans[index].vOutMax / 1000) {
                        trueValue = 2 * Math.abs((this.activeDevice.instruments.awg.chans[index].vOutMax / 1000) - this.offset[index]);
                    }
                }
                else {
                    if (this.offset[index] - (trueValue / 2) < this.activeDevice.instruments.awg.chans[index].vOutMin / 1000) {
                        trueValue = 2 * Math.abs((this.activeDevice.instruments.awg.chans[index].vOutMin / 1000) - this.offset[index]);
                    }
                }

                if (this.amplitude[index] === trueValue) {
                    console.log('the same');

                    this.amplitude[index] = trueValue * 10 + 1;

                    setTimeout(() => {
                        this.amplitude[index] = trueValue;
                    }, 1);

                    return;
                }

                this.amplitude[index] = trueValue;
                break;
            case 'offset':
                if (trueValue < this.activeDevice.instruments.awg.chans[index].vOffsetMin / 1000) {
                    trueValue = this.activeDevice.instruments.awg.chans[index].vOffsetMin / 1000;
                }
                else if (trueValue > this.activeDevice.instruments.awg.chans[index].vOffsetMax / 1000) {
                    trueValue = this.activeDevice.instruments.awg.chans[index].vOffsetMax / 1000;
                }

                if (this.offset[index] === trueValue) {
                    console.log('the same');

                    this.offset[index] = trueValue * 10 + 1;

                    setTimeout(() => {
                        this.offset[index] = trueValue;
                    }, 1);

                    return;
                }

                this.offset[index] = trueValue;
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
    toggleWave(waveType: string, index) {
        if (this.powerOn[index]) {
            return;
        }

        this.waveType[index] = waveType;

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

    frequencyMousewheel(event, index) {
        if (this.powerOn[index]) { return; }

        if (event.deltaY < 0) {
            this.incrementFrequency(index);
        }
        else {
            this.decrementFrequency(index);
        }
    }

    voltageMousewheel(event, type: 'amplitude' | 'offset', index) {
        if (this.powerOn[index]) { return; }

        if (event.deltaY < 0) {
            type === 'amplitude' ? this.incrementAmplitude(index) : this.incrementOffset(index);
        }
        else {
            type === 'amplitude' ? this.decrementAmplitude(index) : this.decrementOffset(index);
        }
    }

    incrementAmplitude(index: number) {
        let newAmp = this.amplitude[index] + 0.1;
        this.amplitude[index] = Math.min(newAmp, this.activeDevice.instruments.awg.chans[0].dacVpp / 1000);
    }

    decrementAmplitude(index: number) {
        let newAmp = this.amplitude[index] - 0.1;
        this.amplitude[index] = Math.max(newAmp, 0);
    }

    incrementOffset(index: number) {
        let newOffset = this.offset[index] + 0.1;
        this.offset[index] = Math.min(newOffset, this.activeDevice.instruments.awg.chans[0].vOffsetMax / 1000);
    }

    decrementOffset(index: number) {
        let newOffset = this.offset[index] - 0.1;
        this.offset[index] = Math.max(newOffset, this.activeDevice.instruments.awg.chans[0].vOffsetMin / 1000);
    }

    incrementFrequency(index: number) {
        let valString = this.frequency[index].toString();
        let leadingNum = parseInt(valString.charAt(0), 10);
        let numberMag = valString.split('.')[0].length - 1;

        leadingNum++;

        if (leadingNum === 10) {
            leadingNum = 1;
            numberMag++;
        }

        let newFreq = leadingNum * Math.pow(10, numberMag);

        if (newFreq < this.activeDevice.instruments.awg.chans[index].signalFreqMin / 1000) {
            newFreq = this.activeDevice.instruments.awg.chans[index].signalFreqMin / 1000;
        }
        else if (newFreq > this.activeDevice.instruments.awg.chans[index].signalFreqMax / 1000) {
            newFreq = this.activeDevice.instruments.awg.chans[index].signalFreqMax / 1000;
        }

        this.frequency[index] = newFreq;
    }

    decrementFrequency(index: number) {
        let valString = this.frequency[index].toString();
        let leadingNum = parseInt(valString.charAt(0), 10);
        let numberMag = valString.split('.')[0].length - 1;

        leadingNum--;

        if (leadingNum === 0) {
            leadingNum = 9;
            numberMag--;
        }

        let newFreq = leadingNum * Math.pow(10, numberMag);

        if (newFreq < this.activeDevice.instruments.awg.chans[index].signalFreqMin / 1000) {
            newFreq = this.activeDevice.instruments.awg.chans[index].signalFreqMin / 1000;
        }

        else if (newFreq > this.activeDevice.instruments.awg.chans[index].signalFreqMax / 1000) {
            newFreq = this.activeDevice.instruments.awg.chans[index].signalFreqMax / 1000;
        }

        this.frequency[index] = newFreq;
    }

    //Toggle power to awg
    togglePower(event, index) {
        this.togglePromise(event, index).catch(e => console.error(e));
    }

    togglePromise(event, index) {
        return new Promise((resolve, reject) => {
            
            this.awaitingResponse = true;

            if (this.tutorialMode) {
                this.finishTutorial();
            }

            let chans = [];
            let settings = [];

            chans[index] = index + 1;

            settings[index] = {
                signalType: this.waveType[index],
                signalFreq: this.frequency[index],
                vpp: this.waveType[index] === 'dc' ? 0 : this.amplitude[index],
                vOffset: this.offset[index]
            };

            if (!this.powerOn[index]) {
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
                            this.frequency[index] = data.actualSignalFreq / 1000;
                        }

                        this.awaitingResponse = false;

                        resolve();
                    },
                    (err) => {
                        console.log(err);

                        this.awaitingResponse = false;

                        console.log('AWG Set Regular and Run Failed');

                        this.stop(chans);
                        this.toastService.createToast('awgRunError', true);

                        reject(err);
                    },
                    () => {
                        this.powerOn[index] = !this.powerOn[index];
                        this.dataTransferService.awgPower = this.powerOn[index];
                    }
                );
            }
            else {
                this.stopPromise(chans).then(resolve);
            }
        });
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
        this.stopPromise(chans).catch(e => console.error(e));
    }

    stopPromise(chans: number[]) {
        return new Promise((resolve, reject) => {
            this.awaitingResponse = true;
    
            this.activeDevice.instruments.awg.stop(chans).subscribe(
                (data) => {
                    this.awaitingResponse = false;
    
                    let powerOffResult = false;
    
                    for (let chan in chans) {
                        this.powerOn[chan] = false;
                        powerOffResult = powerOffResult || (data.awg[chans[chan]][0].statusCode === 0 && this.attemptingPowerOff);
                    }
    
                    this.dataTransferService.awgPower = false;
    
                    if (powerOffResult) {
                        this.attemptingPowerOff = false;
                        this.toastService.createToast('awgRunError', true);
                    }

                    resolve();
                },
                (err) => {
                    this.awaitingResponse = false;
                    console.log('AWG Stop Failed');
                    reject(err);
                },
                () => {
    
                });
        })
    }

    //Determines if active wave type is a square wave
    isSquare(index) {
        if (this.waveType[index] === 'square') {
            return true;
        }

        return false;
    }

}
