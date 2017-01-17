import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import { InstrumentComponent } from '../instrument.component';
import { OscChannelComponent } from './osc-channel.component';
import { WaveformComponent } from '../../data-types/waveform';

//Services
import { TransportService } from '../../../services/transport/transport.service';

@Injectable()
export class OscInstrumentComponent extends InstrumentComponent {

    public numChans: number;
    public chans: OscChannelComponent[] = [];

    public numDataBuffers = 8;
    public dataBuffer: Array<Array<WaveformComponent>> = [];
    public dataBufferWriteIndex: number = 0;
    public dataBufferFillSize: number = 0;
    public activeBuffer: string = '0';


    constructor(_transport: TransportService, _oscInstrumentDescriptor: any) {
        super(_transport, '/');
        console.log('OSC Instrument Constructor');

        //Populate DC supply parameters
        this.numChans = _oscInstrumentDescriptor.numChans;

        //Populate channels        
        for (let channel in _oscInstrumentDescriptor) {
            if (channel !== 'numChans') {
                this.chans.push(new OscChannelComponent(_oscInstrumentDescriptor[channel]));
            }
        }
        for (let i = 0; i < this.numDataBuffers; i++) {
            this.dataBuffer.push([]);
        }
    }

    setParametersJson(chans: number[], offsets: number[], gains: number[], sampleFreqs: number[], bufferSizes: number[], delays: number[]) {
        let command = {
            "osc": {}
        }
        chans.forEach((element, index, array) => {
            command.osc[chans[index]] =
                [
                    {
                        "command": "setParameters",
                        "offset": offsets[index] * 1000,
                        "gain": gains[index],
                        "sampleFreq": Math.round(sampleFreqs[index] * 1000),
                        "bufferSize": bufferSizes[index],
                        "triggerDelay": Math.round(delays[index] * 1000000000000)
                    }
                ]
        });
        return command;
    }

    setParametersParse(chan, responseObject) {
        return 'Channel ' + chan + ' ' + responseObject.command + ' successful';
    }

    //Tell OpenScope to run once and return a buffer
    setParameters(chans: number[], offsets: number[], gains: number[], sampleFreqs: number[], bufferSizes: number[], delays: number[]): Observable<any> {
        if (chans.length == 0) {
            return Observable.create((observer) => {
                observer.complete();
            });
        }

        let command = {
            "osc": {}
        }
        chans.forEach((element, index, array) => {
            command.osc[chans[index]] =
                [
                    {
                        "command": "setParameters",
                        "offset": offsets[index] * 1000,
                        "gain": gains[index],
                        "sampleFreq": Math.round(sampleFreqs[index] * 1000),
                        "bufferSize": bufferSizes[index],
                        "triggerDelay": Math.round(delays[index] * 1000000000000)
                    }
                ]
        });
        return Observable.create((observer) => {
            this.transport.writeRead('/', JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    for (let i = 0; i < chans.length; i++) {
                        if (data.osc == undefined || data.osc[chans[i]][0].statusCode > 0 || data.agent != undefined) {
                            observer.error(data);
                            return;
                        }
                    }
                    observer.next(data);
                    //Handle device errors and warnings
                    observer.complete();
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            )
        });
    }

    //Tell OpenScope to run once and return a buffer
    read(chans: number[]): Observable<any> {
        if (chans.length == 0) {
            return Observable.create((observer) => {
                observer.complete();
            });
        }

        let command = {
            "osc": {}
        }
        chans.forEach((element, index, array) => {
            command.osc[chans[index]] =
                [
                    {
                        "command": "read"
                    }
                ]
        });
        this.dataBuffer[this.dataBufferWriteIndex] = [];
        return Observable.create((observer) => {
            this.transport.writeRead('/', JSON.stringify(command), 'json').subscribe(
                (data) => {
                    console.log('response');
                    //Handle device errors and warnings
                    let count = 0;
                    let i = 0;
                    let stringBuffer = '';
                    while (count < 2 && i < 2000) {
                        let char = '';
                        char += String.fromCharCode.apply(null, new Int8Array(data.slice(i, i + 1)));
                        if (char === '\n') {
                            count++;
                        }
                        stringBuffer += char;
                        i++;
                    }
                    if (i === 2000) {
                        console.log(stringBuffer);
                        observer.error('Osc Read Failed. Try Again');
                        return;
                    }
                    let binaryIndexStringLength = stringBuffer.indexOf('\r\n');
                    let binaryIndex = parseFloat(stringBuffer.substring(0, binaryIndexStringLength));
                    let command;
                    try {
                        command = JSON.parse(stringBuffer.substring(binaryIndexStringLength + 2, binaryIndexStringLength + binaryIndex + 2));
                    }
                    catch (error) {
                        console.log(error);
                        console.log('Error parsing response from read. Printing entire response');
                        console.log(String.fromCharCode.apply(null, new Int8Array(data.slice(0))));
                        observer.error(error);
                        observer.complete();
                        return;
                    }
                    console.log(command);
                    for (let channel in command.osc) {
                        if(command.osc[channel][0].statusCode > 0) {
                            observer.error('One or more channels still acquiring');
                        }
                        let binaryData;
                        try {
                            binaryData = new Int16Array(data.slice(binaryIndexStringLength + 2 + binaryIndex + command.osc[channel][0].binaryOffset, binaryIndexStringLength + 2 + binaryIndex + command.osc[channel][0].binaryOffset + command.osc[channel][0].binaryLength));
                        }
                        catch (e) {
                            console.log(e);
                            observer.error(e);
                            observer.complete();
                        }
                        let untypedArray = Array.prototype.slice.call(binaryData);
                        let scaledArray = untypedArray.map((voltage) => {
                            return voltage / 1000;
                        });
                        let dt = 1 / (command.osc[channel][0].actualSampleFreq / 1000);
                        let pointContainer = [];
                        let triggerPosition = command.osc[chans[0]][0].triggerIndex * dt;
                        if (triggerPosition < 0) {
                            console.log('trigger not in buffer!');
                            triggerPosition = command.osc[channel][0].triggerDelay;
                        }
                        for (let i = 0; i < scaledArray.length; i++) {
                            pointContainer.push([i * dt - triggerPosition, scaledArray[i]]);
                        }
                        this.dataBuffer[this.dataBufferWriteIndex][parseInt(channel) - 1] = new WaveformComponent({
                            dt: 1 / (command.osc[channel][0].actualSampleFreq / 1000),
                            t0: 0,
                            y: scaledArray,
                            data: pointContainer,
                            pointOfInterest: command.osc[channel][0].pointOfInterest,
                            triggerPosition: command.osc[channel][0].triggerIndex,
                            seriesOffset: command.osc[channel][0].actualVOffset / 1000,
                            triggerDelay: command.osc[channel][0].triggerDelay
                        });
                    }
                    this.dataBufferWriteIndex = (this.dataBufferWriteIndex + 1) % this.numDataBuffers;
                    if (this.dataBufferFillSize < this.numDataBuffers) {
                        this.dataBufferFillSize++;
                        this.activeBuffer = this.dataBufferFillSize.toString();
                    }
                    else {
                        this.activeBuffer = (this.numDataBuffers).toString();
                    }
                    observer.next(command);
                    //Handle device errors and warnings
                    observer.complete();
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            )
        });
    }

    //Stream buffers using multiple single calls
    /*streamRunSingle(chans: Array<number>, voltageMultipliers: number[], delay = 0): Observable<Array<WaveformComponent>> {
        //If no channels are active no need to talk to hardware
        if (chans.length == 0) {
            return Observable.create((observer) => {
                observer.complete();
            });
        }

        let command = {
            "osc": {}
        }
        chans.forEach((element, index, array) => {
            command.osc[chans[index]] =
                [
                    {
                        "command": "runSingle"
                    }
                ]
        });

        return Observable.create((observer) => {
            this.transport.streamFrom(this.endpoint, JSON.stringify(command), 'json', delay).subscribe(
                (data) => {
                    //Handle device errors and warnings
                    let megaString = String.fromCharCode.apply(null, new Int8Array(data.slice(0)));
                    let binaryIndexStringLength = megaString.indexOf('\r\n');
                    let binaryIndex = parseFloat(megaString.substring(0, binaryIndexStringLength));
                    let command = JSON.parse(megaString.substring(binaryIndexStringLength + 2, binaryIndex));
                    for (let channel in command.osc) {
                        let binaryData = new Int16Array(data.slice(binaryIndex + command.osc[channel][0].offset, binaryIndex + command.osc[channel][0].offset + command.osc[channel][0].length));
                        let untypedArray = Array.prototype.slice.call(binaryData);
                        let scaledArray = untypedArray.map((voltage) => {
                            return voltage * voltageMultipliers[0];
                        });
                        command.osc[channel][0].waveform.y = scaledArray;
                        this.dataBuffer[this.dataBufferWriteIndex][parseInt(channel)] = new WaveformComponent(command.osc[parseInt(channel)][0].waveform);
                    }
                    observer.next(this.dataBuffer[this.dataBufferWriteIndex]);
                    this.dataBufferWriteIndex = (this.dataBufferWriteIndex + 1) % this.numDataBuffers;
                    if (this.dataBufferFillSize < this.numDataBuffers) {
                        this.dataBufferFillSize++;
                        this.activeBuffer = this.dataBufferFillSize.toString();
                    }
                    else {
                        this.activeBuffer = (this.numDataBuffers).toString();
                    }
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            )
        });
    }*/

    stopStream() {
        this.transport.stopStream();
    }

}