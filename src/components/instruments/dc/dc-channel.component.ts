import {Injectable} from '@angular/core';

@Injectable()
export class DcChannelComponent {

    public voltageMin: number = 0;
    public voltageMax: number = 0;
    public voltageIncrement: number = 0;

    public currentMin: number = 0;
    public currentMax: number = 0;
    public currentIncrement: number = 0;

    constructor(dcChannelDescriptor: any) {

        this.voltageMin = dcChannelDescriptor.voltageMin;
        this.voltageMax = dcChannelDescriptor.voltageMax;
        this.voltageIncrement = dcChannelDescriptor.voltageIncrement;
        
        this.currentMin = dcChannelDescriptor.currentMin;
        this.currentMax = dcChannelDescriptor.currentMax;
        this.currentIncrement = dcChannelDescriptor.currentIncrement;
    }
}