import {Injectable} from '@angular/core';

//Services
import {TransportService} from '../../services/transport/transport.service';


@Injectable()
export abstract class InstrumentComponent {

    protected transport: TransportService;

    protected endpoint: string = '';
    public numChans: number;

    constructor(_transport: TransportService, _endpoint: string) {
        console.log('Generic Instrument Contructor');
        this.transport = _transport;
        this.endpoint = _endpoint;
    }
}