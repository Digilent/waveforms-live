import { Component, Output, EventEmitter } from '@angular/core';
import { ModalController, PopoverController } from 'ionic-angular';

//Components
import { DeviceComponent } from '../../components/device/device.component';
import { GenPopover } from '../../components/gen-popover/gen-popover.component';

//Services
import { DeviceManagerService } from '../../services/device/device-manager.service';
import { SettingsService } from '../../services/settings/settings.service';
import { ToastService } from '../../services/toast/toast.service';
import { TooltipService } from '../../services/tooltip/tooltip.service';

//Interfaces
import { SettingsObject } from '../instruments/awg/awg-instrument.component';

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
    public activeDevice: DeviceComponent;
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

    constructor(
        _deviceManagerService: DeviceManagerService,
        _modalCtrl: ModalController,
        _popoverCtrl: PopoverController,
        _toastService: ToastService,
        _settingsService: SettingsService,
        _tooltipService: TooltipService
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

    //Toggle power to awg
    togglePower(event) {
        if (this.tutorialMode) {
            this.finishTutorial();
        }
        event.stopPropagation();
        let chans = [];
        let settings = [];
        for (let i = 0; i < this.activeDevice.instruments.awg.numChans; i++) {
            chans[i] = i + 1;
            settings[i] = {
                signalType: this.waveType,
                signalFreq: this.frequency,
                vpp: this.amplitude,
                vOffset: this.offset
            };
        }
        if (!this.powerOn) {
            let singleCommand = {
                awg: {
                    setRegularWaveform: [chans, settings],
                    run: [chans]
                }
            }
            this.activeDevice.multiCommand(singleCommand).subscribe(
                (data) => {
                    //console.log(data);
                },
                (err) => {
                    console.log(err);
                    console.log('AWG Set Regular and Run Failed');
                    this.stop(chans);
                    this.toastService.createToast('awgRunError', true);
                },
                () => {
                    //console.log('multi command awg complete');
                    this.powerOn = !this.powerOn;
                }
            );
        }
        else {
            this.stop(chans);
        }
    }

    //Get settings from awg
    setArbitraryWaveform(chans: number[], waveforms, dataTypes: string[]) {
        this.activeDevice.instruments.awg.setArbitraryWaveform(chans, waveforms, ['I16']).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log('AWG Set Arbitrary Failed');
            },
            () => {

            });
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

    //Run awg
    run(chans: number[]) {
        this.activeDevice.instruments.awg.run(chans).subscribe(
            (data) => {
                //console.log(data);
                if (data.statusCode === undefined) {
                    console.log('AWG Run Successful');
                    this.powerOn = !this.powerOn;
                }
                else {
                    this.attemptingPowerOff = true;
                    this.stop(chans);
                }
            },
            (err) => {
                console.log('AWG Run Failed');
            },
            () => {

            });
    }

    //Stop awg
    stop(chans: number[]) {
        this.activeDevice.instruments.awg.stop(chans).subscribe(
            (data) => {
                //console.log(data);
                this.powerOn = false;
                if (data.awg['1'][0].statusCode === 0 && this.attemptingPowerOff) {
                    this.attemptingPowerOff = false;
                    this.toastService.createToast('awgRunError', true);
                }
            },
            (err) => {
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
