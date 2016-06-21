import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {DcChannelComponent} from './dc-channel.component';

//Services
import {TransportService} from '../../../services/transport/transport.service';

@Component({
})
export class DcInstrumentComponent {

    private transport: TransportService;
    private endpoint: string = '/dc';

    public numChans: number;
    public chans: DcChannelComponent[] = [];

    constructor(_transport: TransportService, _dcInstrumentDescriptor: any) {
        //Store reference to device transport for communication with device
        this.transport = _transport;

        //Populate DC supply parameters
        this.numChans = _dcInstrumentDescriptor.numChans;

        //Populate channels        
        _dcInstrumentDescriptor.chans.forEach(dcChanDescriptor => {
            this.chans.push(new DcChannelComponent(dcChanDescriptor));
        })
    }

    //Calibrate the DC power supply.
    //TODO

    //Enumerate instrument info.
    enumerate() {
        let command = {
            command: 'enumerate'
        }
        return this.transport.writeRead(this.endpoint, command);
    }

    //Get the output voltage of the specified DC power supply channel.
    getVoltage(_chan: number): Observable<number> {
        let command = {
            command: "getVoltage",
            chan: _chan
        }

        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, command).subscribe(
                (data) => {
                    //Handle device errors and warnings
                    if (data.statusCode < 1) {
                        observer.next(data.voltage / 1000);
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

    streamVoltage(_chan: number, delay = 0): Observable<number> {
        let command = {
            command: "getVoltage",
            chan: _chan
        }
        
        return Observable.create((observer) => {
            this.transport.streamFrom(this.endpoint, command, delay).subscribe(
                (data) => {
                    //Handle device errors and warnings
                    if (data.statusCode < 1) {
                        observer.next(data.voltage / 1000);
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
    setVoltage(_chan: number, _voltage: number) {
        let command = {
            command: "setVoltage",
            chan: _chan,
            voltage: Math.round(_voltage * 1000)
        }

        return this.transport.writeRead(this.endpoint, command);
    }
    
    stopStream()
    {
        this.transport.stopStream();
    }
}