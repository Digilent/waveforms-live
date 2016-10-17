import {Component} from '@angular/core';

//Services
import {SimulatedDeviceService} from '../../../services/simulated-device/simulated-device.service';

@Component({
})
export class SimulatedOscComponent {
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
    public delays: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

    public defaultAwgSettings: Object = {
        signalType: 'sine',
        signalFreq: 1000000,
        vpp: 3000,
        vOffset: 0
    }
    public defaultOscSettings: Object = {
        sampleFreq: 3000000,
        bufferSize: 10000
    }

    constructor(_simulatedDeviceService: SimulatedDeviceService) {
        this.simulatedDeviceService = _simulatedDeviceService;
    }

    setParameters(chan, commandObject) {
        this.offsets[chan] = commandObject.offset;
        this.gains[chan] = commandObject.gain;
        this.sampleFreqs[chan] = commandObject.sampleFreq;
        this.bufferSizes[chan] = commandObject.bufferSize;
        this.delays[chan] = commandObject.triggerDelay;
        this.simulatedDeviceService.setOscParameters(commandObject, chan);
        return {
            "command": "setParameters",
            "actualOffset": commandObject.offset,
            "actualSampleFreq": commandObject.sampleFreq,
            "statusCode": 0,
            "wait": 0
        };
    }

    read(chan) {
        let targets = this.simulatedDeviceService.getTriggerTargets();
        let returnInfo = {};
            if (targets.osc.indexOf(parseInt(chan)) !== -1) {
                let awgSettings: any = this.simulatedDeviceService.getAwgSettings(1);
                let oscSettings = this.simulatedDeviceService.getOscParameters(chan);
                if (awgSettings.signalType === 'sine') {
                    returnInfo = this.drawSine(awgSettings, oscSettings);
                }
                else if (awgSettings.signalType === 'triangle') {
                    returnInfo = this.drawTriangle(awgSettings, oscSettings);
                }
                else if (awgSettings.signalType === 'sawtooth') {
                    returnInfo = this.drawSawtooth(awgSettings, oscSettings);
                }
                else if (awgSettings.signalType === 'square') {
                    returnInfo = this.drawSquare(awgSettings, oscSettings);
                }
                else {
                    console.log('drawing default wave');
                    returnInfo = this.drawSine(this.defaultAwgSettings, this.defaultOscSettings);
                }

            }
        return returnInfo;
    }

    drawSine(awgSettings, oscSettings) {

        //---------- Simulate Signal ----------
        //Set default values
        let numSamples = oscSettings.bufferSize; //ten thousand points 
        let sigFreq = awgSettings.signalFreq; //in mHz
        let sampleRate = oscSettings.sampleFreq; //30 points per period
        let t0 = 0;
        let vOffset = awgSettings.vOffset; //in mV
        let vpp = awgSettings.vpp; //mV

        //Calculate dt - time between data points
        let dt = 1000 / sampleRate;

        //Clock time in seconds.  Rolls ever every hour.

        //Build Y point arrays
        let y = [];
        for (let j = 0; j < numSamples; j++) {
            y[j] = (vpp / 2) * (Math.sin((2 * Math.PI * (sigFreq / 1000)) * dt * j + t0)) + vOffset;
        }
        
        let typedArray = new Int16Array(y);
        //length is 2x the array length because 2 bytes per entry
        return {
            command: "read",
            statusCode: 0,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            acqCount: 3,
            actualSampleFreq: 1000 / dt,
            y: typedArray,
            pointOfInterest: 16320,
            triggerIndex: 16320,
            actualVOffset: vOffset,
            actualGain: 1
        };
    }
    drawSquare(awgSettings, oscSettings) {
        //Set default values
        let numSamples = oscSettings.bufferSize; //ten thousand points 
        let sigFreq = awgSettings.signalFreq; //in mHz
        let sampleRate = oscSettings.sampleFreq; //30 points per period
        let t0 = 0;
        let vOffset = awgSettings.vOffset; //in mV
        let vpp = awgSettings.vpp; //mV
        let dutyCycle = 50;

        //Calculate dt - time between data points
        let dt = 1000 / sampleRate;
        let y = [];
        let period = 1 / (sigFreq / 1000);

        for (let i = 0; i < numSamples; i++) {
            if ((dt * i + t0) % period < period * (dutyCycle / 100)) {
                y[i] = (vOffset + vpp / 2);
            }
            else {
                y[i] = (vOffset - vpp / 2);
            }
        }
        
        let typedArray = new Int16Array(y);
        
        //length is 2x the array length because 2 bytes per entry
        return {
            command: "read",
            statusCode: 0,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            acqCount: 3,
            actualSampleFreq: 1000 / dt,
            y: typedArray,
            pointOfInterest: 16320,
            triggerIndex: 16320,
            actualVOffset: vOffset,
            actualGain: 1
        };  
    }

    drawTriangle(awgSettings, oscSettings) {
        let numSamples = oscSettings.bufferSize; //ten thousand points 
        let sigFreq = awgSettings.signalFreq; //in mHz
        let sampleRate = oscSettings.sampleFreq; //30 points per period
        let t0 = 0;
        let vOffset = awgSettings.vOffset; //in mV
        let vpp = awgSettings.vpp; //mV

        //Calculate dt - time between data points
        let dt = 1000 / sampleRate;
        let y = [];
        let period = 1 / (sigFreq / 1000);

        for (let i = 0; i < numSamples; i++) {
            y[i] = ((4 * (vpp / 2)) / period) * (Math.abs(((i * dt + t0 + 3 * period / 4) % period) - period / 2) - period / 4) + vOffset;
        }

        let typedArray = new Int16Array(y);
        
        //length is 2x the array length because 2 bytes per entry
        return {
            command: "read",
            statusCode: 0,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            acqCount: 3,
            actualSampleFreq: 1000 / dt,
            y: typedArray,
            pointOfInterest: 16320,
            triggerIndex: 16320,
            actualVOffset: vOffset,
            actualGain: 1
        };

    }

    drawSawtooth(awgSettings, oscSettings) {
        let numSamples = oscSettings.bufferSize; //ten thousand points 
        let sigFreq = awgSettings.signalFreq; //in mHz
        let sampleRate = oscSettings.sampleFreq; //30 points per period
        let t0 = 0;
        let vOffset = awgSettings.vOffset; //in mV
        let vpp = awgSettings.vpp; //mV

        //Calculate dt - time between data points
        let dt = 1000 / sampleRate;
        let y = [];
        let period = 1 / (sigFreq / 1000);

        for (let i = 0; i < numSamples; i++) {
            y[i] = (vpp / period) * ((dt * i + t0) % period) + vOffset;
        }

        let typedArray = new Int16Array(y);
        
        //length is 2x the array length because 2 bytes per entry
        return {
            command: "read",
            statusCode: 0,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            acqCount: 3,
            actualSampleFreq: 1000 / dt,
            y: typedArray,
            pointOfInterest: 16320,
            triggerIndex: 16320,
            actualVOffset: vOffset,
            actualGain: 1
        };

    }

}