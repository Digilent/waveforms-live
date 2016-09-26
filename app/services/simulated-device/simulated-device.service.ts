import {Injectable} from '@angular/core';

@Injectable()
export class SimulatedDeviceService {

    constructor() {
        console.log('sim device service constructor');
    }
    /*AWG Settings*/
    private signalTypes: string[] = ['', '', '', '', '', '', '', ''];
    private signalFreqs: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    private vpps: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    private vOffsets: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

    /*Osc Parameters*/
    private sampleFreqs: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    private bufferSizes: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

    /*Trigger Parameters*/
    private targets: any;

    setAwgSettings(settings: any, channel: number) {
        this.signalTypes[channel] = settings.signalType;
        this.signalFreqs[channel] = settings.signalFreq;
        this.vpps[channel] = settings.vpp;
        this.vOffsets[channel] = settings.vOffset;
    }

    getAwgSettings(channel: number) {
        return {
            signalType: this.signalTypes[channel],
            signalFreq: this.signalFreqs[channel],
            vpp: this.vpps[channel],
            vOffset: this.vOffsets[channel]
        }
    }

    //Not sure if needed after moving read to oscope but here we go anyways TODO tag for future delete
    setOscParameters(parameters: any, channel: number) {
        this.sampleFreqs[channel] = parameters.sampleFreq;
        this.bufferSizes[channel] = parameters.bufferSize;
    }

    getOscParameters(channel: number) {
        return {
            sampleFreq: this.sampleFreqs[channel],
            bufferSize: this.bufferSizes[channel]
        }
    }

    setTriggerTargets(targets: any) {
        this.targets = targets;
    }

    getTriggerTargets() {
        return this.targets;
    }
}