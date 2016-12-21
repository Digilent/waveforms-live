import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import { InstrumentComponent } from '../instrument.component';
import { TriggerChannelComponent } from './trigger-channel.component';
import { WaveformComponent } from '../../data-types/waveform';

//Services
import { TransportService } from '../../../services/transport/transport.service';

@Injectable()
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

    setParametersJson(chans: number[], sources: Object[], targetsArray: Object[]) {
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
        return command;
    }

    setParametersParse(chan, command) {
        console.log(command);
        return 'set Parameters channel ' + chan + ' is done!';
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
                    for (let i = 0; i < chans.length; i++) {
                        if (data.trigger == undefined || data.trigger[chans[i]][0].statusCode > 0 || data.agent != undefined) {
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

    singleJson(chans: number[]) {
        let command = {
            "trigger": {}
        }
        chans.forEach((element, index, array) => {
            command.trigger[chans[index]] =
                [
                    {
                        "command": "single"
                    }
                ]
        });
        return command;
    }

    singleParse(chan, command) {
        return 'single channel ' + chan + ' is done';
    }

    single(chans: number[]): Observable<any> {
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
                        "command": "single"
                    }
                ]
        });
        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    //Handle device errors and warnings
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    for (let i = 0; i < chans.length; i++) {
                        if (data.trigger == undefined || data.trigger[chans[i]][0].statusCode > 0 || data.agent != undefined) {
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

    stopJson(chans: number[]) {
        let command = {
            trigger: {}
        }
        chans.forEach((element, index, array) => {
            command.trigger[chans[index]] = [{
                command: "stop"
            }]
        });
        return command;
    }

    stopParse(chan, command) {
        console.log(command);
        return 'stop done';
    }

    stop(chans: number[]): Observable<any> {
        if (chans.length == 0) {
            return Observable.create((observer) => {
                observer.complete();
            });
        }

        let command = this.stopJson(chans);
        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    //Handle device errors and warnings
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    for (let i = 0; i < chans.length; i++) {
                        if (data.trigger == undefined || data.trigger[chans[i]][0].statusCode > 0 || data.agent != undefined) {
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

    forceTriggerJson(chans: number[]) {
        let command = {
            "trigger": {}
        }
        chans.forEach((element, index, array) => {
            command.trigger[chans[index]] =
                [
                    {
                        "command": "forceTrigger"
                    }
                ]
        });
        return command;
    }

    forceTriggerParse(chan, command) {
        console.log(command);
        return 'force trigger done';
    }

    forceTrigger(chans: number[]): Observable<any> {
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
                        "command": "forceTrigger"
                    }
                ]
        });
        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    //Handle device errors and warnings
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    for (let i = 0; i < chans.length; i++) {
                        if (data.trigger == undefined || data.trigger[chans[i]][0].statusCode > 0 || data.agent != undefined) {
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

    stopStream() {
        this.transport.stopStream();
    }

}