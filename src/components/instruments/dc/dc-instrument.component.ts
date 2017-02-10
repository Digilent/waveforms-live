import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import { InstrumentComponent } from '../instrument.component';
import { DcChannelComponent } from './dc-channel.component';

//Services
import { TransportService } from '../../../services/transport/transport.service';

@Injectable()
export class DcInstrumentComponent extends InstrumentComponent {

    public chans: DcChannelComponent[] = [];

    constructor(_transport: TransportService, _dcInstrumentDescriptor: any) {
        super(_transport, '/');
        console.log('DC Instrument Constructor');

        //Populate DC supply parameters
        this.numChans = _dcInstrumentDescriptor.numChans;

        //Populate channels        
        for (let channel in _dcInstrumentDescriptor) {
            if (channel !== 'numChans') {
                this.chans.push(new DcChannelComponent(_dcInstrumentDescriptor[channel]));
            }
        }
    }

    //TODO - Calibrate the DC power supply.

    //Get the output voltage(s) of the specified DC power supply channel(s).
    getVoltagesJson(chans) {
        console.log('dc get voltages');
        let command = {
            "dc": {}
        }
        chans.forEach((element, index, array) => {
            command.dc[chans[index]] =
                [
                    {
                        "command": "getVoltage"
                    }
                ]
        });
        return command;
    }

    getVoltageParse(chan, responseObject) {
        return 'Channel ' + chan + ' ' + responseObject.command + ' successful';
    }

    setVoltagesJson(chans, voltages) {
        let scaledVoltages = [];
        let command = {
            "dc": {}
        }
        voltages.forEach((element, index, array) => {
            scaledVoltages.push(element * 1000);
            command.dc[chans[index]] =
                [
                    {
                        "command": "setVoltage",
                        "voltage": (element * 1000)
                    }
                ]
        });
        return command;
    }

    setVoltageParse(chan, responseObject) {
        return 'Channel ' + chan + ' ' + responseObject.command + ' successful';
    }

    getVoltages(chans: Array<number>): Observable<any> {
        let command = {
            "dc": {}
        }
        chans.forEach((element, index, array) => {
            command.dc[chans[index]] =
                [
                    {
                        "command": "getVoltage"
                    }
                ]
        });
        return Observable.create((observer) => {
            super._genericResponseHandler(command).subscribe(
                (data) => {
                    for (let i = 0; i < chans.length; i++) {
                        if (data.dc == undefined || data.dc[chans[i]][0].statusCode > 0 || data.agent != undefined) {
                            console.log(data);
                            observer.error(data);
                            return;
                        }
                        data.dc[chans[i]][0].voltage = data.dc[chans[i]][0].voltage / 1000;
                    }

                    //Return voltages and complete observer
                    observer.next(data);
                    observer.complete();
                },
                (err) => {
                    observer.error(err);
                },
                () => { }
            );
        });
    }

    //Set the output voltage of the specified DC power supply channel.
    setVoltages(chans: Array<number>, voltages: Array<number>) {
        //Scale voltages into mV before sending
        let scaledVoltages = [];
        let command = {
            "dc": {}
        }
        voltages.forEach((element, index, array) => {
            scaledVoltages.push(element * 1000);
            command.dc[chans[index]] =
                [
                    {
                        "command": "setVoltage",
                        "voltage": (element * 1000)
                    }
                ]
        });
        return super._genericResponseHandler(command);
    }

    //Streaming read voltages from the specified channel(s)
    streamReadVoltages(chans: Array<number>, delay = 0): Observable<Array<number>> {
        let command = {
            command: "dcGetVoltages",
            chans: chans
        }

        return Observable.create((observer) => {
            this.transport.streamFrom(this.endpoint, JSON.stringify(command), 'json', delay).subscribe(
                (arrayBuffer) => {
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    //Handle device errors and warnings
                    for (let i = 0; i < chans.length; i++) {
                        if (data.dc == undefined || data.dc[chans[i]][0].statusCode > 0 || data.agent != undefined) {
                            observer.error(data);
                            return;
                        }
                    }
                    //Scale from mV to V                            
                    data.voltages.forEach((element, index, array) => {
                        array[index] = element / 1000;
                    });
                    observer.next(data.voltages);

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

    //Stop the current stream
    stopStream() {
        this.transport.stopStream();
    }
}