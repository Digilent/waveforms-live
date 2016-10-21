import {Component, Output, EventEmitter, Input} from '@angular/core';
import {AlertController, PopoverController} from 'ionic-angular';

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
    public alertCtrl: AlertController
    public deviceManagerService: DeviceManagerService;
    public activeDev: DeviceComponent;
    public gpioChans: number[] = [];
    public gpioVals: boolean[] = [];
    public popoverCtrl: PopoverController;
    public gpioDirections: boolean[] = [];

    
    constructor(_alertCtrl: AlertController, _devManagerService: DeviceManagerService, _popoverCtrl: PopoverController) {
        this.alertCtrl = _alertCtrl;
        this.popoverCtrl = _popoverCtrl;
        this.deviceManagerService = _devManagerService;
        this.activeDev = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
        for (let i = 0; i < this.activeDev.instruments.gpio.numChans; i++) {
            this.gpioChans.push(i + 1);
            this.gpioVals.push(false);
            this.gpioDirections.push(false);
        }
        this.contentHidden = true;
        
    }
    
    emitEvent() {
        this.headerClicked.emit(null);
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

    readAllIo(event) {
        event.stopPropagation();
        let inputChans = [];
        for (let i = 0; i < this.gpioChans.length; i++) {
            if (this.gpioDirections[i] !== true) {
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