import {Component} from '@angular/core';

//Services
import {SimulatedDeviceService} from '../../../services/simulated-device/simulated-device.service.ts';

@Component({
})
export class SimulatedTriggerComponent {
    private simulatedDeviceService: SimulatedDeviceService;
    private sources: Array<Object> = [{
        "instrument": null,
        "channel": null,
        "type": null,
        "lowerThreshold": null,
        "upperThreshold": null
    }];
    public targets: Object = {};
    private defaultAwgSettings: Object = {
        signalType: 'sine',
        signalFreq: 1000000,
        vpp: 3,
        vOffset: 0
    }
    private defaultOscSettings: Object = {
        sampleFreq: 3000000,
        bufferSize: 10000
    }

    constructor(_simulatedDeviceService: SimulatedDeviceService) {
        this.simulatedDeviceService = _simulatedDeviceService;
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
                let awgSettings: any = this.simulatedDeviceService.getAwgSettings(element);
                let oscSettings = this.simulatedDeviceService.getOscParameters(element);
                if (awgSettings.signalType === 'sine') {
                    returnInfo[instrument][index] = this.drawSine(awgSettings, oscSettings);
                }
                else if (awgSettings.signalType === 'triangle') {
                    returnInfo[instrument][index] = this.drawTriangle(awgSettings, oscSettings);
                }
                else if (awgSettings.signalType === 'sawtooth') {
                    returnInfo[instrument][index] = this.drawSawtooth(awgSettings, oscSettings);
                }
                else if (awgSettings.signalType === 'square') {
                    returnInfo[instrument][index] = this.drawSquare(awgSettings, oscSettings);
                }
                else {
                    returnInfo[instrument][index] = this.drawSine(this.defaultAwgSettings, this.defaultOscSettings);
                }
                
            });

        }
        return returnInfo;
    }

    forceTrigger() {
        return {
            "statusCode": 0
        };
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
            y[j] = (vpp / 2) * (Math.sin((2 * Math.PI * (sigFreq / 1000)) * dt * j) + vOffset);
        }
        
        let typedArray = new Int16Array(y);
        //length is 2x the array length because 2 bytes per entry
        return {
            verticalOffset: 0,
            sampleFreq: 1000 / dt,
            y: typedArray,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            statusCode: 0
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
        for (let j = 0; j < numSamples; j++) {
            let val = (vpp / 2) * Math.sin((2 * Math.PI * (sigFreq / 1000)) * dt * j);
            if (val > 0) {
                y[j] = vOffset + (vpp / 2);
            }
            else if (val === 0) {
                y[j]
            }
            else {
                y[j] = vOffset - (vpp / 2);
            }
        }
        
        let typedArray = new Int16Array(y);
        
        //length is 2x the array length because 2 bytes per entry
        return {
            verticalOffset: 0,
            sampleFreq: 1000 / dt,
            y: typedArray,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            statusCode: 0
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
            y[i] = ((4 * (vpp / 2)) / period) * (Math.abs(((i * dt + 3 * period / 4) % period) - period / 2) - period / 4);
        }

        let typedArray = new Int16Array(y);
        
        //length is 2x the array length because 2 bytes per entry
        return {
            verticalOffset: 0,
            sampleFreq: 1000 / dt,
            y: typedArray,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            statusCode: 0
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
            y[i] = (vpp / period) * ((dt * i) % period);
        }

        let typedArray = new Int16Array(y);
        
        //length is 2x the array length because 2 bytes per entry
        return {
            verticalOffset: 0,
            sampleFreq: 1000 / dt,
            y: typedArray,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            statusCode: 0
        };

    }

}