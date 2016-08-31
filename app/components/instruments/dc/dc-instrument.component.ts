import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {InstrumentComponent} from '../instrument.component';
import {DcChannelComponent} from './dc-channel.component';

//Services
import {TransportService} from '../../../services/transport/transport.service';

@Component({
})
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
    getVoltages(chans: Array<number>): Observable<Array<number>> {
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
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    //Handle device errors and warnings
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    if (data.statusCode < 1) {
                        let voltages = [];

                        //Scale from mV to V                            
                        for (let voltageRead in data.dc) {
                            if (voltageRead !== 'statusCode') {
                                //hopefully the voltage is located in the first object in the 0th index of the array of the channel property in the dc object in the response object.
                                voltages.push(data.dc[voltageRead][0].voltage / 1000);
                            }
                        }

                        //Return voltages and complete observer
                        observer.next(voltages);
                        observer.complete();
                    }
                    else {
                        observer.error(data.statusCode);
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

        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    //Handle device errors and warnings
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    if (data.statusCode < 1) {
                        observer.next(data);
                        observer.complete();
                    }
                    else {
                        observer.error(data.statusCode);
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
                    if (data.statusCode < 1) {
                        //Scale from mV to V                            
                        data.voltages.forEach((element, index, array) => {
                            array[index] = element / 1000;
                        });
                        observer.next(data.voltages);
                    }
                    else {
                        observer.error(data.statusCode);
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
    }

    //Stop the current stream
    stopStream() {
        this.transport.stopStream();
    }
}