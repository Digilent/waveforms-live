import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {InstrumentComponent} from '../instrument.component';
 
//Services
import {TransportService} from '../../../services/transport/transport.service';

@Component({
})
export class GpioInstrumentComponent extends InstrumentComponent {

    public numChans: number;
    public sinkCurrentMax: number;
    public sourceCurrentMax: number;

    constructor(_transport: TransportService, _gpioInstrumentDescriptor: any) {
        super(_transport, '/');

        //Populate LA supply parameters
        this.numChans = _gpioInstrumentDescriptor.numChans;
        this.sinkCurrentMax = _gpioInstrumentDescriptor.sinkCurrentMax;
        this.sourceCurrentMax = _gpioInstrumentDescriptor.sourceCurrentMax;
    }

    //Get the output voltage(s) of the specified DC power supply channel(s).
    getDirections(chans: Array<number>): Observable<any> {
        let command = {
            "gpio": {}
        }
        chans.forEach((element, index, array) => {
            command.gpio[chans[index]] =
            [
                {
                    "command": "getDirection"
                }
            ]
        });
        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    //Handle device errors and warnings
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));

                    //Return voltages and complete observer
                    observer.next(data);
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

    setDirections(chans: Array<number>, directions: boolean[]): Observable<any> {
        let command = {
            "gpio": {}
        }
        chans.forEach((element, index, array) => {
            command.gpio[chans[index]] =
            [
                {
                    "command": "setDirection",
                    "direction": directions[index]
                }
            ]
        });
        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    //Handle device errors and warnings
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));

                    //Return voltages and complete observer
                    observer.next(data);
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

    //Set the output voltage of the specified DC power supply channel.
    setValues(chans: Array<number>, values: Array<number>) {
        let command = {
            "gpio": {}
        }
        values.forEach((element, index, array) => {
            command.gpio[chans[index]] =
                [
                    {
                        "command": "setValue",
                        "value": values[index]
                    }
                ]
        });
        console.log(command);
        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    //Handle device errors and warnings
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    observer.next(data);
                    observer.complete();

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

    //Set the output voltage of the specified DC power supply channel.
    getValues(chans: Array<number>) {
        let command = {
            "gpio": {}
        }
        chans.forEach((element, index, array) => {
            command.gpio[chans[index]] =
                [
                    {
                        "command": "getValue"
                    }
                ]
        });
        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    //Handle device errors and warnings
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    observer.next(data);
                    observer.complete();

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

}
