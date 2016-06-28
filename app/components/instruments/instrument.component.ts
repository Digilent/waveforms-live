import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import {TransportService} from '../../services/transport/transport.service';


@Component({
})
export abstract class InstrumentComponent {

    protected transport: TransportService;

    protected endpoint: string = '';
    public numChans: number;

    constructor(_transport: TransportService, _endpoint: string) {
        console.log('Generic Instrument Contructor');
        this.transport = _transport;
        this.endpoint = _endpoint;
    }

    //Check to make sure status code exists and determine if process can continue
    //abstract checkStatus(statusCode: number) : Observable<any>;

    //Enumerate instrument info.
    enumerate(): Observable<number> {
        let command = {
            command: 'enumerate'
        }
        return this.transport.writeRead(this.endpoint, command);
    }
}