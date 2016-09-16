import {Component} from '@angular/core';

@Component({
})
export class SimulatedDcComponent {
    private voltages: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

    constructor() {
        
        
    }

    getVoltage(_chan) {
        return {
            command: 'getVoltage',
            voltage: this.voltages[_chan],
            statusCode: 0,
            wait: 100
        }
    }

    setVoltage(_chan, _voltage) {
        console.log('setting ' + _chan + ' to ' + _voltage + 'mV');
        this.voltages[_chan] = _voltage;
        return {
            statusCode: 0
        };
    }

}