import {Component} from '@angular/core';

@Component({
})
export class OscChannelComponent {

    public name: string;

    public resolutionMax: number = 0;
    public bufferSizeMax: number = 0;

    public freqMin: number = 0;
    public freqMax: number = 0;

    public voltageMin: number = 0;
    public voltageMax: number = 0;

    constructor(oscChannelDescriptor: any) {       
        this.name = oscChannelDescriptor.name;

        this.resolutionMax = oscChannelDescriptor.resolutionMax;
        this.bufferSizeMax = oscChannelDescriptor.bufferSizeMax;
        
        this.freqMin = oscChannelDescriptor.freqMin;
        this.freqMax = oscChannelDescriptor.freqMax;
        
        this.voltageMin = oscChannelDescriptor.voltageMin;
        this.voltageMax = oscChannelDescriptor.voltageMax;
    }
}