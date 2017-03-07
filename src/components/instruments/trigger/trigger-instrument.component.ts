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
        return super._genericResponseHandler(command);
    }

    getCurrentState(chans: number[]) {
        let command = {
            trigger: {}
        };
        chans.forEach((element, index, array) => {
            command.trigger[chans[index]] =
                [
                    {
                        command: 'getCurrentState'
                    }
                ]
        });
        return super._genericResponseHandler(command);
    }

    getCurrentStateJson(chans: number[]) {
        let command = {
            trigger: {}
        };
        chans.forEach((element, index, array) => {
            command.trigger[chans[index]] =
                [
                    {
                        command: 'getCurrentState'
                    }
                ]
        });
        return command;
    }

    getCurrentStateParse(chan, responseObject) {
        return 'Success';
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
        return super._genericResponseHandler(command);
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
        return super._genericResponseHandler(command);
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
        return super._genericResponseHandler(command);
    }

    stopStream() {
        this.transport.stopStream();
    }

}