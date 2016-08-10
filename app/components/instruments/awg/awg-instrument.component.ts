import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {InstrumentComponent} from '../instrument.component';
import {AwgChannelComponent} from './awg-channel.component';

//Services
import {TransportService} from '../../../services/transport/transport.service';

@Component({
})
export class AwgInstrumentComponent extends InstrumentComponent {

    public numChans: number;
    public chans: Array<AwgChannelComponent> = [];

    constructor(_transport: TransportService, _awgInstrumentDescriptor: any) {
        super(_transport, '/');

        //Store reference to device transport for communication with device
        this.transport = _transport;

        //Populate AWG supply parameters
        this.numChans = _awgInstrumentDescriptor.numChans;

        //Populate channels  
        _awgInstrumentDescriptor.chans.forEach(awgChanDescriptor => {
            this.chans.push(new AwgChannelComponent(awgChanDescriptor));
        })
    }

    //Enumerate instrument info.
    enumerate(): Observable<number> {
        let command = {
            command: 'awgEnumerate'
        }
        return this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json');
    }

    //Get all settings for the specified channels.
    getSettings(chans: number[]): Observable<Array<any>> {
        let command = {
            "awg": {}
        }
        chans.forEach((element, index, array) => {
            command.awg[chans[index]] =
                [
                    {
                        "command": "getSetting"
                    }
                ]
        });

        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    if (data.statusCode == 0) {
                        observer.next(data);
                        observer.complete();
                    }
                    else {
                        observer.err(data.statusCode);
                    }
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            );
        });
    }

    setSettings(chans: number[], settings: Array<Object>): Observable<Array<any>> {
        let command = {
            "awg": {}
        }
        chans.forEach((element, index, array) => {
            command.awg[chans[index]] =
                [
                    {
                        "command": "setSetting",
                        "settings": settings[index]
                    }
                ]
        });

        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    if (data.statusCode == 0) {
                        observer.next(data);
                        observer.complete();
                    }
                    else {
                        observer.err(data.statusCode);
                    }
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            );
        });
    }

    //Get the offset voltage for the specified channel.
    getOffsets(_chan: Array<number>): Observable<Array<number>> {
        let command = {
            command: "awgGetOffsets",
            chans: _chan
        }

        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (data) => {
                    //Handle device errors and warnings
                    if (data.statusCode == 0) {

                        //Scale from mV to V                            
                        data.offsets.forEach((element, index, array) => {
                            array[index] = element / 1000;
                        });

                        //Return voltages and complete observer
                        observer.next(data.offsets);
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

    //Set the offset voltage for the specified channel.
    setOffsets(chans: Array<number>, offsets: Array<number>): Observable<number> {

        //Scale offsets into mV before sending
        let scaledOffsets = [];
        offsets.forEach((element, index, array) => {
            scaledOffsets.push(element * 1000);
        });

        let command = {
            command: "awgSetOffsets",
            chans: chans,
            offsets: scaledOffsets
        }

        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (data) => {
                    //Handle device errors and warnings
                    if (data.statusCode < 1) {
                        observer.next(data.offset / 1000);
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
}
