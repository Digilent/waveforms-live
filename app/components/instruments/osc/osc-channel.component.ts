import {Component} from '@angular/core';

@Component({
})
export class OscChannelComponent {

    public effectiveBits: number;
    public bufferSizeMax: number;
    public bufferDataType: string;
    public resolution: number;
    public dtMin: number;
    public dtMax: number;
    public adcVpp: number;
    public inputVoltageMax: number;
    public inputVoltageMin: number;
    public gains: number[];

    constructor(oscChannelDescriptor: any) {       

        
        this.effectiveBits = oscChannelDescriptor.effectiveBits;
        this.bufferSizeMax = oscChannelDescriptor.bufferSizeMax;
        this.bufferDataType = oscChannelDescriptor.bufferDataType;
        this.resolution = oscChannelDescriptor.resolution;
        this.dtMin = oscChannelDescriptor.dtMin;
        this.dtMax = oscChannelDescriptor.dtMax;
        this.adcVpp = oscChannelDescriptor.adcVpp;
        this.inputVoltageMax = oscChannelDescriptor.inputVoltageMax;
        this.inputVoltageMin = oscChannelDescriptor.inputVoltageMin;
        this.gains = oscChannelDescriptor.gains;
        
    }

    
}