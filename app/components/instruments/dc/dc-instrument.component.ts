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
        super(_transport, '/dc');
        console.log('DC Instrument Constructor');

        //Populate DC supply parameters
        this.numChans = _dcInstrumentDescriptor.numChans;

        //Populate channels        
        _dcInstrumentDescriptor.chans.forEach(dcChanDescriptor => {
            this.chans.push(new DcChannelComponent(dcChanDescriptor));
        })
    }

    //TODO - Calibrate the DC power supply.

    //Get the output voltage(s) of the specified DC power supply channel(s).
    getVoltages(chans: Array<number>): Observable<Array<number>> {
        let command = {
            command: "getVoltages",
            chans: chans
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
    setVoltages(chans: Array<number>, voltages: Array<number>) {

        //Scale voltages into mV before sending
        voltages.forEach((element, index, array) => {
            array[index] = element * 1000;
        });

        //Setup command to transfer
        let command = {
            command: "setVoltages",
            chans: chans,
            voltages: voltages
        }
        return this.transport.writeRead(this.endpoint, command);
    }

    //Streaming read voltages from the specified channel(s)
    streamReadVoltages(chans: Array<number>, delay = 0): Observable<Array<number>> {
        let command = {
            command: "getVoltages",
            chans: chans
        }

        return Observable.create((observer) => {
            this.transport.streamFrom(this.endpoint, command, delay).subscribe(
                (data) => {
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