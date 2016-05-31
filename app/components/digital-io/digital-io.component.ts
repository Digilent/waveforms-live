import {Component, Output, EventEmitter, Input} from 'angular2/core';
import {IONIC_DIRECTIVES} from 'ionic-angular';
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
    
    constructor() {
        this.numGpio = 8;
        this.gpioArray = [0, 1, 2, 3, 4, 5, 6, 7];
        this.contentHidden = true;
        this.showMenu = false;
    }
    
    isInput() {
        return true;
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
}