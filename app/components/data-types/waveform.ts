import {Component} from '@angular/core';

@Component({
})
export class WaveformComponent {

    public t0: number;
    public dt: number;
    public y: Array<number>;

    constructor(waveformDescriptor: any)
    constructor(t0: number, dt: number, y: Array<number>)
    constructor(wfDescOrT0: any | number, dt?: number, y?: Array<number>) {
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
        }
    }
}