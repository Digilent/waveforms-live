import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {AwgChannelComponent} from './awg-channel.component';

//Services
import {TransportService} from '../../../services/transport/transport.service';

@Component({
})
export class AwgInstrumentComponent {

    private transport: TransportService;
    private endpoint: string = '/awg';

    public numChans: number;
    public chans: Array<AwgChannelComponent> = [];

    constructor(_transport: TransportService, _awgInstrumentDescriptor: any) {
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
            command: 'enumerate'
        }
        return this.transport.writeRead(this.endpoint, command);
    }

    //Set the offset voltage for the specified channel.
    setOffset(_chan: number): Observable<number> {
        let command = {
            command: 'setOffset',
            chan: _chan
        }
        return this.transport.writeRead(this.endpoint, command);
    }
    
    //Get the offset voltage for the specified channel.
    getOffset(_chan: number): Observable<number> {
        let command = {
            command: "getOffset",
            chan: _chan
        }

        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, command).subscribe(
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
    
    //Get the offset voltage for the specified channel.
    setOffsets(_chans: Array<number>): Observable<number> {
        let command = {
            command: "setOffset",
            chans: _chans
        }

        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, command).subscribe(
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
