import {Component, Output, EventEmitter, Input} from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
  templateUrl: 'build/components/dc-supply/dc-supply.html',
  selector: 'dc-supply',
  directives: [NgClass]
})
export class DcSupplyComponent { 
    @Output() headerClicked: EventEmitter<any> = new EventEmitter();
    @Input() contentHidden: boolean;
    private voltageSupplies: number[];
    private voltages: string[];
    private currents: string[];
    private dcPower: boolean;
    private maxVoltages: number[];
    private maxCurrents: number[];
    private correctVoltages: boolean[];
    private correctCurrents: boolean[];
    
    constructor() {
        this.voltageSupplies = [0, 1, 2];
        this.contentHidden = true;
        this.voltages = ['5.00', '5.00', '-5.00'];
        this.currents = ['1.00', '1.00', '1.00'];
        this.dcPower = false;
        this.maxVoltages = [6, 25, -25];
        this.maxCurrents = [1, 1, 1];
        this.correctCurrents = [true, true, true];
        this.correctVoltages = [true, true, true];
    }
    
    togglePower() {
        for (let i = 0; i < this.voltageSupplies.length; i++) {
            if (this.correctCurrents[i] === false || this.correctVoltages[i] === false) {
                return;
            }
        }
        this.dcPower = !this.dcPower;
    }

    validateSupply(supplyNum: number) {
        if ((parseFloat(this.voltages[supplyNum]) < 0 || parseFloat(this.voltages[supplyNum]) > this.maxVoltages[supplyNum]) && this.maxVoltages[supplyNum] > 0) {
            //bad shit
            console.log(supplyNum + ' is messed up dude');
            this.correctVoltages[supplyNum] = false;
            return;
        }
        if (this.maxVoltages[supplyNum] < 0 && (parseFloat(this.voltages[supplyNum]) > 0 || parseFloat(this.voltages[supplyNum]) < this.maxVoltages[supplyNum])) {
            //negative supply
            console.log(supplyNum + ' is negative and messed yo');
            this.correctVoltages[supplyNum] = false;
            return;
        }
        this.correctVoltages[supplyNum] = true;
    }

    validateCurrent(supplyNum: number) {
        if (parseFloat(this.currents[supplyNum]) < 0 || parseFloat(this.currents[supplyNum]) > this.maxCurrents[supplyNum]) {
            console.log(supplyNum + ' is wrong mosuckra');
            this.correctCurrents[supplyNum] = false;
            return;
        }
        this.correctCurrents[supplyNum] = true;
    }
}