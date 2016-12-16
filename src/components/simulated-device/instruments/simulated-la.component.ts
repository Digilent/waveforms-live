import { Injectable } from '@angular/core';

//Services
import { SimulatedDeviceService } from '../../../services/simulated-device/simulated-device.service';

@Injectable()
export class SimulatedLaComponent {
    public simulatedDeviceService: SimulatedDeviceService;
    public buffers: number[][] = [];
    public sampleFreqs: number[] = [];
    public bufferSizes: number[] = [];
    public laDescriptor;

    constructor(_simulatedDeviceService: SimulatedDeviceService) {
        this.simulatedDeviceService = _simulatedDeviceService;
        this.laDescriptor = this.simulatedDeviceService.getEnumeration().la;
        for (let i = 0; i < this.laDescriptor.numChans; i++) {
            this.buffers.push([]);
            this.sampleFreqs.push(0);
            this.bufferSizes.push(0);
        }
    }

    setParameters(chan, commandObject) {
        this.sampleFreqs[chan] = commandObject.sampleFreq;
        this.bufferSizes[chan] = commandObject.bufferSize;
        this.simulatedDeviceService.setLaParameters(commandObject, chan);
        return {
            "command": "setParameters",
            "statusCode": 0,
            "actualSampleFreq": 6250000000,
            "wait": 0
        };
    }

    read(chan) {
        return this.generateLaData(chan);
    }

    generateLaData(channel: number) {
        let maxBufferSize = Math.max(...this.bufferSizes);
        let typedArray = new Int16Array(maxBufferSize);
        for (let i = 0; i < typedArray.length; i++) {
            typedArray[i] = i;
        }
        return {
            command: "read",
            statusCode: 0,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            acqCount: 3,
            actualSampleFreq: this.sampleFreqs[channel],
            y: typedArray,
            pointOfInterest: this.bufferSizes[channel] / 2,
            triggerIndex: this.bufferSizes[channel] / 2
        };
    }


}