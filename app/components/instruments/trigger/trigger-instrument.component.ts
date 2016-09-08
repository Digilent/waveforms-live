import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {InstrumentComponent} from '../instrument.component';
import {TriggerChannelComponent} from './trigger-channel.component';
import {WaveformComponent} from '../../data-types/waveform';

//Services
import {TransportService} from '../../../services/transport/transport.service';

@Component({
})
export class TriggerInstrumentComponent extends InstrumentComponent {

    public numChans: number;
    public numDataBuffers = 8;
    public chans: TriggerChannelComponent[] = [];
    public dataBuffer: Array<Array<WaveformComponent>> = [];
    public dataBufferWriteIndex: number = 0;
    public dataBufferFillSize: number = 0;
    public activeBuffer: string = '0';


    constructor(_transport: TransportService, _triggerInstrumentDescriptor: any) {
        super(_transport, '/');
        console.log('Trigger Instrument Constructor');

        //Populate DC supply parameters
        //this.numChans = _triggerInstrumentDescriptor.numChans;

        //Initialize Data Buffers
        for (let i = 0; i < this.numDataBuffers; i++) {
            this.dataBuffer.push(Array(this.numChans));
        }

        //Populate channels        
        /*for (let channel in _triggerInstrumentDescriptor) {
            this.chans.push(new TriggerChannelComponent(_triggerInstrumentDescriptor[channel]));
        }*/
    }

    //Tell OpenScope to run once and return a buffer
    setParameters(chans: number[], sources: Object[], targetsArray: Object[]): Observable<any> {
        if (chans.length == 0) {
            return Observable.create((observer) => {
                observer.complete();
            });
        }

        let command = {
            "trigger": {}
        }
        chans.forEach((element, index, array) => {
            command.trigger[chans[index]] =
                [
                    {
                        "command": "setParameters",
                        "source": sources[index],
                        "targets": targetsArray[index]
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

    run(chans: number[]): Observable<any> {
        //If no channels are active no need to talk to hardware
        if (chans.length == 0) {
            return Observable.create((observer) => {
                observer.complete();
            });
        }

        let command = {
            "trigger": {}
        }
        chans.forEach((element, index, array) => {
            command.trigger[chans[index]] =
                [
                    {
                        "command": "run"
                    }
                ]
        });
        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    //Handle device errors and warnings
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

    //Read
    read(chans: number[]): Observable<any> {
        //If no channels are active no need to talk to hardware
        if (chans.length == 0) {
            return Observable.create((observer) => {
                observer.complete();
            });
        }

        let command = {
            "trigger": {}
        }
        chans.forEach((element, index, array) => {
            command.trigger[chans[index]] =
                [
                    {
                        "command": "read"
                    }
                ]
        });

        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
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
                    let command = JSON.parse(stringBuffer.substring(binaryIndexStringLength + 2, binaryIndexStringLength + binaryIndex + 2));
                    for (let channel in command.trigger) {
                        if (command.trigger[channel][0].osc !== undefined) {
                            for (let instrumentChannel in command.trigger[channel][0].osc) {
                                let binaryData = new Int16Array(data.slice(binaryIndexStringLength + 2 + binaryIndex + command.trigger[channel][0].osc[instrumentChannel].binaryOffset, binaryIndexStringLength + 2 + binaryIndex + command.trigger[channel][0].osc[instrumentChannel].binaryOffset +           command.trigger[channel][0].osc[instrumentChannel].binaryLength));
                                let untypedArray = Array.prototype.slice.call(binaryData);
                                let scaledArray = untypedArray.map((voltage) => {
                                    return voltage / 1000;
                                });
                                this.dataBuffer[this.dataBufferWriteIndex][bufferCount] = new WaveformComponent({
                                    dt: command.trigger[channel][0].osc[instrumentChannel].dt / 1000000000000,
                                    t0: 0,
                                    y: scaledArray
                                });
                                bufferCount++;
                            }

                        }
                        if (command.trigger[channel][0].la !== undefined) {
                            for (let instrumentChannel in command.trigger[channel][0].la) {
                                let binaryData = new Int16Array(data.slice(binaryIndex + command.trigger[channel][0].la[instrumentChannel].binaryOffset, binaryIndex + command.trigger[channel][0].la[instrumentChannel].binaryOffset + command.trigger[channel][0].la[instrumentChannel].binaryLength));
                                let untypedArray = Array.prototype.slice.call(binaryData);
                                let scaledArray = untypedArray.map((voltage) => {
                                    return voltage / 1000;
                                });
                            }
                        }
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

    stopStream() {
        this.transport.stopStream();
    }

}