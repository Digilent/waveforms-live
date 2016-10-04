import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {LaChannelComponent} from './la-channel.component';
import {InstrumentComponent} from '../instrument.component';
import {WaveformComponent} from '../../data-types/waveform';

//Services
import {TransportService} from '../../../services/transport/transport.service';

@Component({
})
export class LaInstrumentComponent extends InstrumentComponent {

    public numChans: number;
    public chans: Array<LaChannelComponent> = [];

    public numDataBuffers = 8;
    public dataBuffer: Array<Array<WaveformComponent>> = [];
    public dataBufferWriteIndex: number = 0;
    public dataBufferFillSize: number = 0;
    public activeBuffer: string = '0';

    constructor(_transport: TransportService, _laInstrumentDescriptor: any) {
        super(_transport, '/')

        //Populate LA supply parameters
        this.numChans = _laInstrumentDescriptor.numChans;

        //Populate channels  
        for (let channel in _laInstrumentDescriptor) {
            if (channel !== 'numChans') {
                this.chans.push(new LaChannelComponent(_laInstrumentDescriptor[channel]));
            }
        }

        for (let i = 0; i < this.numDataBuffers; i++) {
            this.dataBuffer.push([new WaveformComponent('null')]);
        }
    }

    setParametersJson(chans: number[], offsets: number[], gains: number[], sampleFreqs: number[], bufferSizes: number[]) {
        let command = {
            "la": {}
        }
        chans.forEach((element, index, array) => {
            command.la[chans[index]] =
                [
                    {
                        "command": "setParameters",
                        "sampleFreq": sampleFreqs[index] * 1000,
                        "bufferSize": bufferSizes[index]
                    }
                ]
        });
        return command;
    }

    setParametersParse(chan, responseObject) {
        return 'Channel ' + chan + ' ' + responseObject.command + ' successful';
    }

    //Tell OpenScope to run once and return a buffer
    setParameters(chans: number[], offsets: number[], gains: number[], sampleFreqs: number[], bufferSizes: number[]): Observable<any> {
        if (chans.length == 0) {
            return Observable.create((observer) => {
                observer.complete();
            });
        }

        let command = {
            "la": {}
        }
        chans.forEach((element, index, array) => {
            command.la[chans[index]] =
                [
                    {
                        "command": "setParameters",
                        "sampleFreq": sampleFreqs[index] * 1000,
                        "bufferSize": bufferSizes[index]
                    }
                ]
        });
        return Observable.create((observer) => {
            this.transport.writeRead('/', JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
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
            "la": {}
        }
        chans.forEach((element, index, array) => {
            command.la[chans[index]] =
                [
                    {
                        "command": "read"
                    }
                ]
        });
        return Observable.create((observer) => {
            this.transport.writeRead('/', JSON.stringify(command), 'json').subscribe(
                (data) => {
                    //Handle device errors and warnings
                    let bufferCount = 0;
                    let count = 0;
                    let i = 0;
                    let stringBuffer = '';
                    while (count < 2) {
                        let char = '';
                        char += String.fromCharCode.apply(null, new Int8Array(data.slice(i, i + 1)));
                        if (char === '\n') {
                            count++;
                        }
                        stringBuffer += char;
                        i++;
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
                    for (let channel in command.la) {
                        console.log(command);
                        let binaryData = new Int16Array(data.slice(binaryIndexStringLength + 2 + binaryIndex + command.la[channel][0].binaryOffset, binaryIndexStringLength + 2 + binaryIndex + command.la[channel][0].binaryOffset + command.la[channel][0].binaryLength));
                        let untypedArray = Array.prototype.slice.call(binaryData);
                        console.log(untypedArray);
                        let channelsObject = {};
                        for (let i = 0; i < 10; i++) {
                            channelsObject[i.toString()] = [];
                        }
                        let start = performance.now();
                        for (let j = 0; j < untypedArray.length; j++) {
                            for (let i = 0; i < 10; i++) {
                                let andVal = Math.pow(2, i);
                                //console.log('andVal: ' + andVal);
                                let seriesVal = andVal & untypedArray[j];
                                if (seriesVal) {
                                    //console.log('channel ' + i + ' is high');
                                    channelsObject[i].push(1);
                                }
                                else {
                                    //console.log('channel ' + i + ' is low');
                                    channelsObject[i].push(0);
                                }
                            }
                        }
                        let finish = performance.now();
                        console.log('Time: ' + (finish - start));
                        console.log(channelsObject);

                        this.dataBuffer[this.dataBufferWriteIndex][bufferCount] = new WaveformComponent({
                            dt: 1 / (command.la[channel][0].actualSampleFreq / 1000),
                            t0: 0,
                            y: channelsObject['0'],
                            pointOfInterest: command.la[channel][0].pointOfInterest,
                            triggerPosition: command.la[channel][0].triggerDelta,
                            seriesOffset: 500
                        });
                        bufferCount++;
                        this.dataBufferWriteIndex = (this.dataBufferWriteIndex + 1) % this.numDataBuffers;
                        if (this.dataBufferFillSize < this.numDataBuffers) {
                            this.dataBufferFillSize++;
                            this.activeBuffer = this.dataBufferFillSize.toString();
                        }
                        else {
                            this.activeBuffer = (this.numDataBuffers).toString();
                        }
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
}
