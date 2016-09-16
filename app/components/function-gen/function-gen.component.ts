import {Component, EventEmitter} from '@angular/core';
import {ModalController, PopoverController} from 'ionic-angular';

//Pages
import {ModalFgenPage} from '../../pages/fgen-modal/fgen-modal';
import {TestPage} from '../../pages/test-page/test-page';

//Components
import {DeviceComponent} from '../../components/device/device.component';
import {GenPopover} from '../../components/gen-popover/gen-popover.component';

//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';
import {StorageService} from '../../services/storage/storage.service';

//Interfaces
import {SettingsObject} from '../instruments/awg/awg-instrument.component';

@Component({
  templateUrl: 'build/components/function-gen/function-gen.html',
  selector: 'fgen'
})
export class FgenComponent { 
    private showDutyCycle: boolean;
    public waveType: string;
    public frequency: string;
    public amplitude: string;
    public offset: string;
    public dutyCycle: string;
    private showWaves: boolean;
    public powerOn: boolean;
    private deviceManagerService: DeviceManagerService;
    private activeDevice: DeviceComponent;
    public supportedSignalTypes: string[];

    private storageService: StorageService;
    private storageEventListener: EventEmitter<any>;
    private modalCtrl: ModalController;
    private popoverCtrl: PopoverController;
    
    constructor(_deviceManagerService: DeviceManagerService, 
                _storageService: StorageService, 
                _modalCtrl: ModalController,
                _popoverCtrl: PopoverController) {
        this.modalCtrl = _modalCtrl;
        this.popoverCtrl = _popoverCtrl;
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.getActiveDevice();
        this.supportedSignalTypes = this.activeDevice.instruments.awg.chans[0].signalTypes;
        this.showDutyCycle = false;
        this.waveType = 'sine';
        this.frequency = '1000';
        this.amplitude = '3';
        this.offset = '0';
        this.dutyCycle = '50';
        this.showWaves = false;
        this.powerOn = false;

        this.storageService = _storageService;
        this.storageEventListener = this.storageService.saveLoadEventEmitter.subscribe((data) => {
            if (data === 'save') {
                this.storageService.saveData('awg', JSON.stringify({
                    waveType: this.waveType,
                    frequency: this.frequency,
                    amplitude: this.amplitude,
                    offset: this.offset,
                    dutyCycle: this.dutyCycle
                }));
            }
            else if (data === 'load') {
                this.storageService.getData('awg').then((data) => {
                    let dataObject = JSON.parse(data);
                    console.log(dataObject);
                    this.waveType = dataObject.waveType;
                    this.frequency = dataObject.frequency;
                    this.amplitude = dataObject.amplitude;
                    this.offset = dataObject.offset;
                    this.dutyCycle = dataObject.dutyCycle; 
                });
            }
        });
    }

    //Remove storage event listener to avoid memory leaks
    ngOnDestroy() {
        this.storageEventListener.unsubscribe();
    }
    
    //Toggle dropdown
    toggleWave(waveType: string) {
        this.showWaves = !this.showWaves;
        this.waveType = waveType;
    }
    
    //Toggle power to awg
    togglePower() {
        this.powerOn = !this.powerOn;
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
        if (this.powerOn) {
            this.setRegularWaveform(chans, settings);
            this.run(chans);
        }
        else {
            this.stop(chans);
            /*let numPoints = 30000;
            let waveform = {
                y: [],
                t0: 0,
                dt: 1
            };
            let period = 0;
            if (parseFloat(this.frequency) != 0) {
                period = 1 / parseFloat(this.frequency);
            }
            let dt = (2 * period) / numPoints;
            waveform.dt = dt;
            for (let i = 0; i < numPoints; i++) {
                waveform.y[i] = parseFloat(this.amplitude) * Math.sin(((Math.PI * 2) / (numPoints / 2)) * i) + parseFloat(this.offset);
            }
            this.setArbitraryWaveform(chans, [waveform], ['I16']);*/
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
                console.log(data);
            },
            (err) => {
                console.log('AWG Set Regular Failed');
            },
            () => {

            });
    }

    //Run awg
    run(chans: number[]) {
        this.activeDevice.instruments.awg.run(chans).subscribe(
            (data) => {
                console.log(data);
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
                console.log(data);
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
        genPopover.onDidDismiss(data=> {
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
