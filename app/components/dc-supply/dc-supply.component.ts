import {Component, Output, EventEmitter, Input} from 'angular2/core';
import {IONIC_DIRECTIVES} from 'ionic-angular';
import {NgClass} from 'angular2/common';

@Component({
  templateUrl: 'build/components/dc-supply/dc-supply.html',
  selector: 'dc-supply',
  directives: [IONIC_DIRECTIVES, NgClass]
})
export class DcSupplyComponent { 
    @Output() headerClicked: EventEmitter<any> = new EventEmitter();
    @Input() contentHidden: boolean;
    private voltageSupplies: number[];
    private voltages: string[];
    private currents: string[];
    private dcPower: boolean;
    private maxVoltages: number[];
    
    constructor() {
        this.voltageSupplies = [0, 1, 2];
        this.contentHidden = true;
        this.voltages = ['5.00', '5.00', '-5.00'];
        this.currents = ['1.00', '1.00', '1.00'];
        this.dcPower = false;
        this.maxVoltages = [6, 25, -25];
    }
    
    togglePower() {
        this.dcPower = !this.dcPower;
    }
}