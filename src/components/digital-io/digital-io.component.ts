import {Component, Output, EventEmitter, Input} from '@angular/core';
import {AlertController, PopoverController, ToastController} from 'ionic-angular';

//Components
import {DeviceComponent} from '../device/device.component';
import {DigitalIoPopover} from '../digital-io-popover/digital-io-popover.component';

//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';

@Component({
  templateUrl: 'digital-io.html',
  selector: 'digital-io'
})
export class DigitalIoComponent { 
    @Output() headerClicked: EventEmitter<any> = new EventEmitter();
    @Input() contentHidden: boolean;
    public alertCtrl: AlertController;
    public toastCtrl: ToastController;
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
    
    constructor(_alertCtrl: AlertController, _devManagerService: DeviceManagerService, _popoverCtrl: PopoverController, _toastCtrl: ToastController) {
        this.alertCtrl = _alertCtrl;
        this.toastCtrl = _toastCtrl;
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

    toggleDigiSettings() {
        this.showDigiContent = !this.showDigiContent;
    }

    toggleDirectionMode() {
        this.directionMode = !this.directionMode;
        if (this.directionMode) {
            let toast = this.toastCtrl.create({
                message: 'Click A Channel To Set It As An Output',
                duration: 2000,
                position: 'bottom'
            });
            toast.present();
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
            () => {}
        );
        this.laActiveChans[channel] = false;
    }

    setMode(mode: string) {
        if (mode === 'analyzer') {
            let toast = this.toastCtrl.create({
                message: 'Analyzer Currently Unsupported',
                showCloseButton: true,
                position: 'bottom'
            });
            toast.present();
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
            () => {}
        );
        
    }

    toggleLaChan(channel: number) {
        this.laActiveChans[channel] = !this.laActiveChans[channel];
        this.gpioDirections[channel] = false;
        this.gpioVals[channel] = false;
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
        event.stopPropagation();
        let inputChans = [];
        for (let i = 0; i < this.gpioChans.length; i++) {
            if (this.gpioDirections[i] !== true && this.laActiveChans[i] !== true) {
                inputChans.push(i + 1);
            }
        }
        this.activeDev.instruments.gpio.read(inputChans).subscribe(
            (data) => {
                for (let channel in data.gpio) {
                    this.gpioVals[parseInt(channel) - 1] = data.gpio[channel][0].value === 1 ? true : false;
                }
            },
            (err) => {
                console.log(err);
            },
            () => {}
        );
    }
    
    //Open checkbox alert
    doCheckbox(event) {
        event.stopPropagation();
        let popover = this.popoverCtrl.create(DigitalIoPopover, {
            digitalComponent: this
        });
        popover.present({
            ev: event
        });
    }
}