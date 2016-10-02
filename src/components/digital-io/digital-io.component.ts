import {Component, Output, EventEmitter, Input} from '@angular/core';
import {AlertController} from 'ionic-angular';

//Components
import {DeviceComponent} from '../device/device.component';

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
    //false = input, true = output
    public gpioDirections: boolean[] = [];

    
    constructor(_alertCtrl: AlertController, _devManagerService: DeviceManagerService) {
        this.alertCtrl = _alertCtrl;
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
        console.log('hey2');
        this.headerClicked.emit(null);
    }

    toggleChannel(channel: number) {
        this.gpioVals[channel] = !this.gpioVals[channel];
        let value = 0;
        if (this.gpioVals[channel] === true) {
            value = 1;
        }
        this.activeDev.instruments.gpio.setValues([channel + 1], [value]).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => {}
        );
        
    }
    
    //Open checkbox alert
    doCheckbox() {
        event.stopPropagation();
        let okFlag: boolean = false;   
        let alert = this.alertCtrl.create();
        alert.setTitle('Select Outputs');
        
        for (let i = 0; i < this.gpioChans.length; i++) {
            if (this.gpioDirections[i] == true) {
                alert.addInput({
                    type: 'checkbox',
                    label: 'Channel: ' + (i + 1),
                    value: i.toString(),
                    checked: true
                });
            }
            else {
                alert.addInput({
                    type: 'checkbox',
                    label: 'Channel: ' + (i + 1),
                    value: i.toString(),
                    checked: false
                });
            }
            
        }

        alert.addButton({
            text: 'Cancel',
            handler: data => {
               return true;
            }
        });
        
        alert.addButton({
            text: 'Done',
            handler: data => {
                for (let i = 0, j = 0; i < this.gpioDirections.length; i++) {
                    if (parseInt(data[j]) === i) {
                        if (this.gpioDirections[i] === false) {
                            this.gpioDirections[parseInt(data[j])] = true;
                            this.gpioVals[parseInt(data[j])] = false;
                        }
                        j++;
                    }
                    else {
                        if (this.gpioDirections[i] === true) {
                            this.gpioVals[i] = false;
                        }
                        this.gpioDirections[i] = false;
                    }
                }
                return true;
            }
        });

        alert.present();
    }
}