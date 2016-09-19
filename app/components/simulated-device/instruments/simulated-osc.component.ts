import {Component} from '@angular/core';

//Services
import {SimulatedDeviceService} from '../../../services/simulated-device/simulated-device.service.ts';

@Component({
})
export class SimulatedOscComponent {
    private simulatedDeviceService: SimulatedDeviceService;
    private buffers: number[][] = [
        [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000],
        [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000],
        [],
        [],
        [],
        []
    ];
    private offsets: number[] = [0, 0, 0];
    private gains: number[] = [1, 1, 1];

    constructor(_simulatedDeviceService: SimulatedDeviceService) {
        this.simulatedDeviceService = _simulatedDeviceService;
    }

    setParameters(chan, offset, gain) {
        this.offsets[chan] = offset;
        this.gains[chan] = gain;
        return {
            "command": "setParameters",
            "actualOffset": 3100,
            "statusCode": 0,
            "wait": 0
        };
    }

}