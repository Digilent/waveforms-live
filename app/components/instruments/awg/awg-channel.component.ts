import {Component} from '@angular/core';

@Component({
})
export class AwgChannelComponent {

    public resolutionMax: number = 0;
    public bufferSizeMax: number = 0;

    public freqMin: number = 0;
    public freqMax: number = 0;

    public voltageMin: number = 0;
    public voltageMax: number = 0;

    constructor(awgChannelDescriptor: any) {

        this.resolutionMax = awgChannelDescriptor.resolutionMax;
        this.bufferSizeMax = awgChannelDescriptor.bufferSizeMax;
        
        this.freqMin = awgChannelDescriptor.freqMin;
        this.freqMax = awgChannelDescriptor.freqMax;
        
        this.voltageMin = awgChannelDescriptor.voltageMin;
        this.voltageMax = awgChannelDescriptor.voltageMax;
    }
}