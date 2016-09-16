import {Component} from '@angular/core';

@Component({
})
export class SimulatedTriggerComponent {
    private sources: Array<Object> = [{
        "instrument": null,
        "channel": null,
        "type": null,
        "lowerThreshold": null,
        "upperThreshold": null
    }];
    private targets: Object = {};

    constructor() {
           
    }

    setParameters(chan, source, targets) {
        this.sources[chan] = source;
        this.targets = targets;
        return {
            "command": "setParameters",
            "statusCode": 0,
            "wait": 0
        };
    }

    run() {
        return {
            "command": "run",
            "statusCode": 0,
            "wait": -1,
            "acqCount": 27
        };
    }

    read(chan) {
        let returnInfo = {
            "command": "read",
            "statusCode": 0,
            "wait": 0,
            "acqCount": 27,
        };
        for (let instrument in this.targets) {
            returnInfo[instrument] = {};
            this.targets[instrument].forEach((element, index, array) => {
                returnInfo[instrument][index] = {};
                returnInfo[instrument][index] = this.drawSine(index);
            });

        }

        return returnInfo;
    }

    forceTrigger() {
        return {
            "statusCode": 0
        };
    }

    drawSine(chan) {

        //---------- Simulate Signal ----------
        //Set default values
        let sampleRate = 1000;
        let numSamples = 1000;
        let sigFreq = 100;
        let t0 = 0;
        let phaseOffset = 0;

        //Calculate dt - time between data points
        var dt = 1 / sampleRate * 1000;

        //Calculate start time offset to simulate continuously running signal
        var d = new Date();
        //Clock time in seconds.  Rolls ever every hour.
        var clockTimeOffset = (d.getTime() % 3600000) / 1000;

        //Build Y point arrays
        let wf = null;

        let y = [];
        for (var j = 0; j < numSamples; j++) {
            y[j] = 1000 * Math.sin((Math.PI / 180) * ((360 * ((dt / 1000 * j * sigFreq) + clockTimeOffset)) + phaseOffset + 90 * parseInt(chan)));
        }
        let typedArray = new Int16Array(y);
        wf = {
            't0': clockTimeOffset,
            'dt': 0.001,
            'y': typedArray
        };
        //length is 2x the array length because 2 bytes per entry
        return {
            verticalOffset: 0,
            dt: 160000,
            y: typedArray,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            statusCode: 0
        };
    }

}