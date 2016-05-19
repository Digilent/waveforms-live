import {Component, Output, EventEmitter} from 'angular2/core';
import {IONIC_DIRECTIVES} from 'ionic-angular';

@Component({
  templateUrl: 'build/components/dc-supply/dc-supply.html',
  selector: 'dc-supply',
  directives: [IONIC_DIRECTIVES]
})
export class DcSupplyComponent { 
    @Output() headerClicked: EventEmitter<any> = new EventEmitter();
    private voltageSupplies: number[];
    
    constructor() {
        this.voltageSupplies = [0, 1, 2];
    }
  
}