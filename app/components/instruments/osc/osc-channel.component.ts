import {Component} from '@angular/core';

@Component({
})
export class OscChannelComponent {

    public effectiveBits: number;
    public bufferSizeMax: number;
    public bufferDataType: string;
    public sampleClock: number;
    public sampleClockDividers: number[];
    public adcRange: number;
    public inputSwingOffset: number;
    public inputSwingRange: number;
    public gains: number[];

    constructor(oscChannelDescriptor: any) {       

        this.effectiveBits = oscChannelDescriptor.effectiveBits;
        this.bufferSizeMax = oscChannelDescriptor.bufferSizeMax;
        this.bufferDataType = oscChannelDescriptor.bufferDataType;
        this.sampleClock = oscChannelDescriptor.sampleClock;
        this.sampleClockDividers = oscChannelDescriptor.sampleClockDividers;
        this.adcRange = oscChannelDescriptor.adcRange;
        this.inputSwingOffset = oscChannelDescriptor.inputSwingOffset;
        this.inputSwingRange = oscChannelDescriptor.inputSwingRange;
        this.gains = oscChannelDescriptor.gains;
    }
}