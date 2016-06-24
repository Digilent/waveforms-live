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
export class DcInstrumentComponent extends InstrumentComponent{
    
    public chans: DcChannelComponent[] = [];
    
    constructor(_transport: TransportService, _dcInstrumentDescriptor: any) {
        super(_transport, '/dc');
        console.log('DC Instrument Constructor');

        //Populate DC supply parameters
        this.numChans = _dcInstrumentDescriptor.numChans;

        //Populate channels        
        _dcInstrumentDescriptor.chans.forEach(dcChanDescriptor => {
            this.chans.push(new DcChannelComponent(dcChanDescriptor));
        })
    } 

    //Calibrate the DC power supply.
    //TODO

    //Get the output voltage(s) of the specified DC power supply channel(s).
    getVoltages(_chans: Array<number>): Observable<Array<number>> {
        let command = {
            command: "getVoltages",
            chans: _chans
        }

        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, command).subscribe(
                (data) => {
                    //Handle device errors and warnings
                    if (data.statusCode < 1) {
                           
                        //Scale from mV to V                            
                        data.voltages.forEach((element, index, array) => {
                            array[index] = element / 1000;
                        });
                        
                        //Return voltages and complete observer
                        observer.next(data.voltages);
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
    setVoltages(_chans: Array<number>, _voltages: Array<number>) {
        
        //Scale voltages into mV before sending
        _voltages.forEach((element, index, array) => {
            array[index] =  element * 1000;
        });
        
        //Setup command to transfer
        let command = {
            command: "setVoltages",
            chans: _chans,
            voltages: _voltages
        }
        return this.transport.writeRead(this.endpoint, command);
    }

    streamVoltage(_chan: number, delay = 0): Observable<number> {
        let command = {
            command: "getVoltages",
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

    stopStream() {
        this.transport.stopStream();
    }
}