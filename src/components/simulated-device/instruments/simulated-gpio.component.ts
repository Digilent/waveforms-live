import {Injectable} from '@angular/core';

//Services
import {SimulatedDeviceService} from '../../../services/simulated-device/simulated-device.service';

@Injectable()
export class SimulatedGpioComponent {
    public simulatedDeviceService: SimulatedDeviceService;
    public values: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    public directions: string[] = ['input', 'input', 'input', 'input', 'input', 'input', 'input', 'input', 'input', 'input'];
    public counter: number = 1;
    public prevChannel: number = -1;

    constructor(_simulatedDeviceService: SimulatedDeviceService) {
        this.simulatedDeviceService = _simulatedDeviceService;
        
    }

    counterVal(_chan) {
        if (parseInt(_chan) <= this.prevChannel) {this.counter++}
        this.values[_chan] = (this.counter & Math.pow(2, _chan - 1)) > 0 ? 1 : 0;
        this.prevChannel = parseInt(_chan);
    }

    getValue(_chan) {
        this.counterVal(_chan);
        return {
            command: 'getValue',
            value: this.values[_chan],
            statusCode: 0,
            wait: 100
        }
    }

    setValue(_chan, _value) {
        console.log('setting ' + _chan + ' to ' + _value);
        this.values[_chan] = _value;
        return {
            command: 'setValue',
            statusCode: 0,
            wait: 0
        };
    }

    getDirection(_chan) {
        return {
            command: 'getDirection',
            direction: this.values[_chan],
            statusCode: 0,
            wait: 100
        }
    }

    setDirection(_chan, _direction) {
        console.log('setting ' + _chan + ' to ' + _direction);
        this.values[_chan] = _direction;
        return {
            command: 'setDirection',
            statusCode: 0,
            wait: 0
        };
    }

}