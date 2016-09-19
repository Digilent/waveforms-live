import {Component} from '@angular/core';

//Services
import {SimulatedDeviceService} from '../../../services/simulated-device/simulated-device.service.ts';

@Component({
})
export class SimulatedDcComponent {
    private simulatedDeviceService: SimulatedDeviceService;
    private voltages: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

    constructor(_simulatedDeviceService: SimulatedDeviceService) {
        this.simulatedDeviceService = _simulatedDeviceService;
        
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