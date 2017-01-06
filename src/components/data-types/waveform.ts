import {Injectable} from '@angular/core';

@Injectable()
export class WaveformComponent {

    public t0: number;
    public dt: number;
    public y: Array<number>;
    public data: Array<number[]>;
    public pointOfInterest: number = 0;
    public triggerPosition: number = 0;
    public seriesOffset: number = 0;
    public triggerDelay: number = 0;

    constructor(waveformDescriptor: any)
    constructor(t0: number, dt: number, y: Array<number>)
    constructor(wfDescOrT0: any | number, dt?: number, y?: Array<number>, pointOfInterest?: number, triggerPosition?: number, seriesOffset?: number) {
        if (typeof (wfDescOrT0) === 'number') {
            //Construct waveform from parameters
            this.t0 = <number>wfDescOrT0; 
            this.dt = dt;
            this.y = y;
        } else {
            //Construct waveform from waveform descriptor object                   
            this.t0 = wfDescOrT0.t0;
            this.dt = wfDescOrT0.dt;
            this.y = wfDescOrT0.y;
            this.data = wfDescOrT0.data;
            this.pointOfInterest = wfDescOrT0.pointOfInterest;
            this.triggerPosition = wfDescOrT0.triggerPosition;
            this.seriesOffset = wfDescOrT0.seriesOffset;
            this.triggerDelay = wfDescOrT0.triggerDelay;
        }
    }
}