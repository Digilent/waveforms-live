import {Component} from '@angular/core';

//Services
import {SimulatedDeviceService} from '../../../services/simulated-device/simulated-device.service';

@Component({
})
export class SimulatedLaComponent {
    public simulatedDeviceService: SimulatedDeviceService;
    public buffers: number[][] = [
        [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000],
        [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000],
        [],
        [],
        [],
        []
    ];
    public offsets: number[] = [0, 0, 0];
    public gains: number[] = [1, 1, 1];
    public sampleFreqs: number[] = [0, 0, 0, 0, 0, 0, 0];
    public bufferSizes: number[] = [0, 0, 0, 0, 0, 0, 0];

    constructor(_simulatedDeviceService: SimulatedDeviceService) {
        this.simulatedDeviceService = _simulatedDeviceService;
    }

    setParameters(chan, commandObject) {
        this.offsets[chan] = commandObject.offset;
        this.gains[chan] = commandObject.gain;
        this.sampleFreqs[chan] = commandObject.sampleFreq;
        this.bufferSizes[chan] = commandObject.bufferSize;
        this.simulatedDeviceService.setLaParameters(commandObject, chan);
        return {
            "command":"setParameters",
            "statusCode":0,
            "actualSampleFreq": 6250000000,
            "wait":0
        };
    }

    read(chan) {
        let targets = this.simulatedDeviceService.getTriggerTargets();
        let returnInfo = {};
        targets.osc.forEach((element, index, array) => {
            returnInfo = this.generateLaData();

            });
        return returnInfo;
    }

    generateLaData() {
        let typedArray = new Int16Array(10000);
        for (let i = 0; i < typedArray.length; i++) {
            typedArray[i] = i;
        }
        return {
            command: "read",
            statusCode: 0,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            acqCount: 3,
            actualSampleFreq: 6250000000,
            y: typedArray,
            pointOfInterest: 16384,
            triggerDelta: -16384,
            actualGain: 1
        };
    }


}