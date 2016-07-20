import {Component, EventEmitter} from '@angular/core';
import {NavController, Modal} from 'ionic-angular';

//Pages
import {ModalFgenPage} from '../../pages/fgen-modal/fgen-modal';
import {TestPage} from '../../pages/test-page/test-page';

//Components
import {DeviceComponent} from '../../components/device/device.component';

//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';
import {StorageService} from '../../services/storage/storage.service';

/* Notes for component and modal
* Eventually receive info from modal and update service with new values
* Discuss small version of waveform that is viewable from the main slide out menu
* Pass chart by reference (?) or load settings from service so each chart looks the same
*   Small highchart -> http://jsfiddle.net/zPDca/1/
* Nav Params must be objects
*/

@Component({
  templateUrl: 'build/components/function-gen/function-gen.html',
  selector: 'fgen'
})
export class FgenComponent { 
    private nav: NavController;
    private showDutyCycle: boolean;
    private waveType: string;
    private frequency: string;
    private amplitude: string;
    private offset: string;
    private dutyCycle: string;
    private showWaves: boolean;
    private powerOn: boolean;
    private deviceManagerService: DeviceManagerService;
    private activeDevice: DeviceComponent;

    private storageService: StorageService;
    private storageEventListener: EventEmitter<any>;
    
    constructor(_nav: NavController, _deviceManagerService: DeviceManagerService, _storageService: StorageService) {
        this.nav = _nav;
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.getActiveDevice();
        this.showDutyCycle = false;
        this.waveType = 'sine';
        this.frequency = '1000';
        this.amplitude = '2.5';
        this.offset = '2.5';
        this.dutyCycle = '50';
        this.showWaves = false;
        this.powerOn = false;

        this.storageService = _storageService;
        this.storageEventListener = this.storageService.saveLoadEventEmitter.subscribe((data) => {
            console.log(data);
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

    ngOnDestroy() {
        this.storageEventListener.unsubscribe();
    }
    
    toggleWave(waveType: string) {
        this.showWaves = !this.showWaves;
        this.waveType = waveType;
    }
    
    togglePower() {
        this.powerOn = !this.powerOn;
        let chans = [];
        let settings = [{},{}];
        for (let i = 0; i < this.activeDevice.instruments.awg.numChans; i++) {
            chans[i] = i;
            settings[i] = {
                numSamples: 5 * (i + 1),
                sampleRate: 5 * (i + 1),
                offset: 5 * (i + 1),
            };
        }
        if (this.powerOn) {
            this.getSettings(chans);
        }
        else {
            this.setSettings(chans,settings);
        }
    }

    getSettings(chans: number[]) {
        this.activeDevice.instruments.awg.getSettings(chans).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log('AWG Read Offset Failed');
            },
            () => {

            });
    }

    setSettings(chans: number[], settings: Array<Object>) {
        this.activeDevice.instruments.awg.setSettings(chans, settings).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log('AWG Set Settings Failed');
            },
            () => {

            });
    }

    openFgen(num) {
        console.log('in open fgen');
        let modal = Modal.create(ModalFgenPage, {
            value: num, 
            waveType: this.waveType,
            frequency: this.frequency,
            amplitude: this.amplitude,
            offset: this.offset,
            dutyCycle: this.dutyCycle
        });
        modal.onDismiss(data=> {
           this.waveType = data.waveType;
           this.frequency = data.frequency;
           this.amplitude = data.amplitude;
           this.offset = data.offset;
           this.dutyCycle = data.dutyCycle; 
        });
        this.nav.present(modal);
        console.log('modal present');
    }
    
    isSquare() {
        if (this.waveType === 'square') {
            return true;
        }
        return false;
    }
    
}
