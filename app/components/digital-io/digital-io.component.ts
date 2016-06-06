import {Component, Output, EventEmitter, Input, OnInit} from 'angular2/core';
import {IONIC_DIRECTIVES, Alert, NavController} from 'ionic-angular';
import {NgClass} from 'angular2/common';

@Component({
  templateUrl: 'build/components/digital-io/digital-io.html',
  selector: 'digital-io',
  directives: [IONIC_DIRECTIVES, NgClass]
})
export class DigitalIoComponent { 
    @Output() headerClicked: EventEmitter<any> = new EventEmitter();
    @Input() contentHidden: boolean;
    private numGpio: number;
    private gpioArray: number[];
    private showMenu: boolean;
    public nav: NavController;
    
    private outputArray: boolean[];
    
    private gpioObject: Object;
    
    constructor(_nav: NavController) {
        this.numGpio = 8;
        this.gpioArray = [0, 1, 2, 3, 4, 5, 6, 7];
        this.gpioObject = {
            channels: [0, 1, 2, 3, 4, 5, 6, 7],
            outputs: [false, false, false, false, false, false, false, false]
        };
        this.outputArray = [true, true, true, true, false, false, false, false];
        this.contentHidden = true;
        this.showMenu = false;
        
        this.nav = _nav;
    }
    
    ngOnInit() {
        /*for (let i = 0; i < this.gpioArray.length; i++) {
            this.outputArray[i] = false;
        }*/
    }
    
    isInput(channel: number) {
        if (this.outputArray[channel] === false) {
            return true;
        }
        return false;
    }
    
    isHigh(channel: number) {
        if (channel % 2 == 0) {
            return true;
        }
        return false;
    }
    
    toggleMenu() {
        this.showMenu = !this.showMenu;
    }
    
    doCheckbox() {
        let alert = Alert.create();
        alert.setTitle('Select Outputs');
        let cancelArray: boolean[] = [];
        
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
            //need to clear to reset outputs with data handler
            cancelArray[i] = this.outputArray[i];
            this.outputArray[i] = false;
        }

        alert.addButton({
            text: 'Cancel',
            handler: data=> {
                console.log(data);
                for(let i = 0; i < cancelArray.length; i++) {
                    this.outputArray[i] = cancelArray[i];
                }
            }
        });
        
        alert.addButton({
            text: 'Okay',
            handler: data => {
                console.log('Checkbox data:', data);
                for(let i = 0; i < data.length; i++) {
                    let j = parseInt(data[i]);
                    this.outputArray[j] = true;
                }
            }
        });

        this.nav.present(alert).then(() => {
            
        });
    }
}