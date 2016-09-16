import {Component} from '@angular/core';

@Component({
})

export class SimulatedAwgComponent {
    private signalTypes: string[] = ['', '', '', '', '', '', '', ''];
    private signalFreqs: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    private vpps: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    private vOffsets: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

    constructor() {


    }

    setArbitraryWaveform(chan) {
        return {
            statusCode: 0,
            wait: 0
        };
    }

    setRegularWaveform(chan, commandObject) {
        this.signalTypes[chan] = commandObject.signalType;
        this.signalFreqs[chan] = commandObject.signalFreq;
        this.vpps[chan] = commandObject.vpp;
        this.vOffsets[chan] = commandObject.vOffset;
        return {
            statusCode: 0,
            wait: 0
        };
    }

    run(chan) {
        return {
            statusCode: 0,
            wait: 0
        }
    }

    stop(chan) {
        return {
            statusCode: 0,
            wait: 0
        };
    }
}

