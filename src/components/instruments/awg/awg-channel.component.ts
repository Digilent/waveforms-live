import {Injectable} from '@angular/core';

@Injectable()
export class AwgChannelComponent {

    public signalTypes: string[];
    public signalFreqMin: number;
    public signalFreqMax: number;
    public dataType: string;
    public bufferSizeMax: number;
    public dacVpp: number;
    public dtMin: number;
    public dtMax: number;
    public vOffsetMin: number;
    public vOffsetMax: number;
    public vOutMin: number;
    public vOutMax: number;

    constructor(awgChannelDescriptor: any) {

        this.signalTypes = awgChannelDescriptor.signalTypes;
        this.signalFreqMin = awgChannelDescriptor.signalFreqMin;
        this.signalFreqMax = awgChannelDescriptor.signalFreqMax;
        this.dataType = awgChannelDescriptor.dataType;
        this.bufferSizeMax = awgChannelDescriptor.bufferSizeMax;
        this.dacVpp = awgChannelDescriptor.dacVpp;
        this.dtMin = awgChannelDescriptor.dtMin;
        this.dtMax = awgChannelDescriptor.dtMax;
        this.vOffsetMin = awgChannelDescriptor.vOffsetMin;
        this.vOffsetMax = awgChannelDescriptor.vOffsetMax;
        this.vOutMin = awgChannelDescriptor.vOutMin;
        this.vOutMax = awgChannelDescriptor.vOutMax;
    }
    
}