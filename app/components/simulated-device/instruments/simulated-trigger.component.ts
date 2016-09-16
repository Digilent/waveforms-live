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
    public targets: Object = {};

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
                returnInfo[instrument][index] = this.drawSawtooth();
            });

        }

        return returnInfo;
    }

    forceTrigger() {
        return {
            "statusCode": 0
        };
    }

    drawSine() {

        //---------- Simulate Signal ----------
        //Set default values
        let numSamples = 10000; //ten thousand points 
        let sigFreq = 1000000; //in mHz
        let sampleRate = 30 * (sigFreq / 1000); //30 points per period
        let t0 = 0;
        let vOffset = 0; //in mV
        let vpp = 3; //mV

        //Calculate dt - time between data points
        let dt = 1 / sampleRate;

        //Clock time in seconds.  Rolls ever every hour.

        //Build Y point arrays

        let y = [];
        for (let j = 0; j < numSamples; j++) {
            y[j] = (1000 * vpp / 2) * (Math.sin((2 * Math.PI * (sigFreq / 1000)) * dt * j) + vOffset);
        }
        
        let typedArray = new Int16Array(y);
        
        //length is 2x the array length because 2 bytes per entry
        return {
            verticalOffset: 0,
            dt: dt * 1000000000000,
            y: typedArray,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            statusCode: 0
        };
    }
    drawSquare() {
        //Set default values
        let numSamples = 10000; //ten thousand points 
        let sigFreq = 1000000; //in mHz
        let sampleRate = 30 * (sigFreq / 1000); //30 points per period
        let t0 = 0;
        let vOffset = 0; //in mV
        let vpp = 3; //mV
        let dutyCycle = 50;

        //Calculate dt - time between data points
        let dt = 1 / sampleRate;
        let y = [];
        for (let j = 0; j < numSamples; j++) {
            let val = (1000 * vpp / 2) * Math.sin((2 * Math.PI * (sigFreq / 1000)) * dt * j);
            if (val > 0) {
                y[j] = vOffset + 1000 * (vpp / 2);
            }
            else if (val === 0) {
                y[j]
            }
            else {
                y[j] = vOffset - 1000 * (vpp / 2);
            }
        }
        
        let typedArray = new Int16Array(y);
        
        //length is 2x the array length because 2 bytes per entry
        return {
            verticalOffset: 0,
            dt: dt * 1000000000000,
            y: typedArray,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            statusCode: 0
        };  
    }

    drawTriangle() {
        let numSamples = 10000; //ten thousand points 
        let sigFreq = 1000000; //in mHz
        let sampleRate = 30 * (sigFreq / 1000); //30 points per period
        let t0 = 0;
        let vOffset = 0; //in mV
        let vpp = 3; //mV
        let dutyCycle = 50;

        //Calculate dt - time between data points
        let dt = 1 / sampleRate;
        let y = [];
        let period = 1 / (sigFreq / 1000);

        for (let i = 0; i < numSamples; i++) {
            y[i] = ((4000 * (vpp / 2)) / period) * (Math.abs(((i * dt) % period) - period / 2) - period / 4);
        }

        let typedArray = new Int16Array(y);
        
        //length is 2x the array length because 2 bytes per entry
        return {
            verticalOffset: 0,
            dt: dt * 1000000000000,
            y: typedArray,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            statusCode: 0
        };

    }

    drawSawtooth() {
        let numSamples = 10000; //ten thousand points 
        let sigFreq = 1000000; //in mHz
        let sampleRate = 30 * (sigFreq / 1000); //30 points per period
        let t0 = 0;
        let vOffset = 0; //in mV
        let vpp = 3; //mV
        let dutyCycle = 50;

        //Calculate dt - time between data points
        let dt = 1 / sampleRate;
        let y = [];
        let period = 1 / (sigFreq / 1000);

        for (let i = 0; i < numSamples; i++) {
            y[i] = (1000 * vpp / period) * ((dt * i) % period);
        }

        let typedArray = new Int16Array(y);
        
        //length is 2x the array length because 2 bytes per entry
        return {
            verticalOffset: 0,
            dt: dt * 1000000000000,
            y: typedArray,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            statusCode: 0
        };

    }

}