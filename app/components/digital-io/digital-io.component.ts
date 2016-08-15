import {Component, Output, EventEmitter, Input} from '@angular/core';
import {AlertController} from 'ionic-angular';
import {NgClass} from '@angular/common';

@Component({
  templateUrl: 'build/components/digital-io/digital-io.html',
  selector: 'digital-io',
  directives: [NgClass]
})
export class DigitalIoComponent { 
    @Output() headerClicked: EventEmitter<any> = new EventEmitter();
    @Input() contentHidden: boolean;
    private numGpio: number;
    private gpioArray: number[];
    private showMenu: boolean;
    private alertCtrl: AlertController
    private outputArray: boolean[];
    
    private gpioObject: Object;
    
    constructor(_alertCtrl: AlertController) {
        this.alertCtrl = _alertCtrl;
        this.numGpio = 8;
        this.gpioArray = [0, 1, 2, 3, 4, 5, 6, 7];
        this.gpioObject = {
            channels: [0, 1, 2, 3, 4, 5, 6, 7],
            outputs: [false, false, false, false, false, false, false, false]
        };
        this.outputArray = [true, true, true, true, false, false, false, false];
        this.contentHidden = true;
        this.showMenu = false;
        
    }
    
    //Determines if channel is an input
    isInput(channel: number) {
        if (this.outputArray[channel] === false) {
            return true;
        }
        return false;
    }
    
    //Determines if channel value is high or low
    isHigh(channel: number) {
        if (channel % 2 == 0) {
            return true;
        }
        return false;
    }
    
    //Togges menu
    toggleMenu() {
        this.showMenu = !this.showMenu;
    }
    
    //Open checkbox alert
    doCheckbox() {
        let okFlag: boolean = false;   
        let alert = this.alertCtrl.create();
        alert.setTitle('Select Outputs');
        
        for(let i = 0; i < this.gpioArray.length; i++) {
            if (this.outputArray[i] == true) {
                alert.addInput({
                    type: 'checkbox',
                    label: 'Channel: ' + i,
                    value: i.toString(),
                    checked: true
                });
            }
            else {
                alert.addInput({
                    type: 'checkbox',
                    label: 'Channel: ' + i,
                    value: i.toString()
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
                for (let i = 0, j = 0; i < this.outputArray.length; i++) {
                    if (i == parseInt(data[j])) {
                        this.outputArray[parseInt(data[i])] = true;
                        j++;
                    }
                    else {
                        this.outputArray[i] = false;
                    }
                }
                return true;
            }
        });

        alert.present();
    }
}