import { Component, EventEmitter } from '@angular/core';
import { ModalController, PopoverController, ToastController } from 'ionic-angular';

//Pages
import { ModalFgenPage } from '../../pages/fgen-modal/fgen-modal';

//Components
import { DeviceComponent } from '../../components/device/device.component';
import { GenPopover } from '../../components/gen-popover/gen-popover.component';

//Services
import { DeviceManagerService } from '../../services/device/device-manager.service';

//Interfaces
import { SettingsObject } from '../instruments/awg/awg-instrument.component';

@Component({
    templateUrl: 'function-gen.html',
    selector: 'fgen'
})
export class FgenComponent {
    public showDutyCycle: boolean;
    public waveType: string;
    public frequency: string;
    public amplitude: string;
    public offset: string;
    public dutyCycle: string;
    public powerOn: boolean;
    public deviceManagerService: DeviceManagerService;
    public activeDevice: DeviceComponent;
    public supportedSignalTypes: string[];
    public attemptingPowerOff: boolean = false;
    public storageEventListener: EventEmitter<any>;
    public modalCtrl: ModalController;
    public popoverCtrl: PopoverController;
    public toastCtrl: ToastController;
    public showSettings: boolean = true;
    public showChanSettings: boolean[] = [true];

    constructor(_deviceManagerService: DeviceManagerService,
        _modalCtrl: ModalController,
        _popoverCtrl: PopoverController,
        _toastCtrl: ToastController) {
        this.modalCtrl = _modalCtrl;
        this.popoverCtrl = _popoverCtrl;
        this.toastCtrl = _toastCtrl;
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.getActiveDevice();
        this.supportedSignalTypes = this.activeDevice.instruments.awg.chans[0].signalTypes;
        for (let i = 0; i < this.activeDevice.instruments.awg.numChans - 1; i++) {
            this.showChanSettings.push(false);
        }
        this.showDutyCycle = false;
        this.waveType = 'sine';
        this.frequency = '1000';
        this.amplitude = '3';
        this.offset = '0';
        this.dutyCycle = '50';
        this.powerOn = false;
    }

    //Toggle dropdown
    toggleWave(waveType: string) {
        if (this.powerOn) {
            return;
        }
        this.waveType = waveType;
    }

    toggleChanSettings(channel: number) {
        this.showChanSettings[channel] = !this.showChanSettings[channel];
    }

    toggleAwgSettings() {
        this.showSettings = !this.showSettings;
    }

    //Toggle power to awg
    togglePower() {
        let chans = [];
        let settings = [];
        for (let i = 0; i < this.activeDevice.instruments.awg.numChans; i++) {
            chans[i] = i + 1;
            settings[i] = {
                signalType: this.waveType,
                signalFreq: parseFloat(this.frequency),
                vpp: parseFloat(this.amplitude),
                vOffset: parseFloat(this.offset)
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
                    let toast = this.toastCtrl.create({
                        message: 'Error Setting AWG Parameters. The AWG May Have Been Running And Has Been Stopped. Please Try Again.',
                        showCloseButton: true,
                        duration: 5000,
                        position: 'bottom'
                    });
                    toast.present();
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
                let toast = this.toastCtrl.create({
                    message: 'Error Setting AWG Parameters. Please Try Again. If Problem Persists, Reset The Device',
                    showCloseButton: true,
                    position: 'bottom'
                });
                toast.present();
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
                    let toast = this.toastCtrl.create({
                        message: 'Error Running AWG. AWG Has Been Stopped Automatically. Please Try Again',
                        showCloseButton: true,
                        position: 'bottom'
                    });
                    toast.present();
                }
            },
            (err) => {
                console.log('AWG Stop Failed');
            },
            () => {

            });
    }

    //Open function generator / awg modal
    openFgen(num) {
        let modal = this.modalCtrl.create(ModalFgenPage, {
            value: num,
            waveType: this.waveType,
            frequency: this.frequency,
            amplitude: this.amplitude,
            offset: this.offset,
            dutyCycle: this.dutyCycle,
            fgenComponent: this
        });
        modal.present();
    }

    openPopover(event) {
        let genPopover = this.popoverCtrl.create(GenPopover, {
            dataArray: this.supportedSignalTypes
        });
        genPopover.present({
            ev: event
        });
        genPopover.onDidDismiss(data => {
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
