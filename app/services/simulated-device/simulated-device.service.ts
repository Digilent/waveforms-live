import {Injectable} from '@angular/core';

@Injectable()
export class SimulatedDeviceService {

    constructor() {
        console.log('sim device service constructor');
    }

    private signalTypes: string[] = ['', '', '', '', '', '', '', ''];
    private signalFreqs: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    private vpps: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    private vOffsets: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

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
            vOffsets: this.vOffsets[channel]
        }
    }
}