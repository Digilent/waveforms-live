import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {LaChannelComponent} from './la-channel.component';

//Services
import {TransportService} from '../../../services/transport/transport.service';

@Component({
})
export class LaInstrumentComponent {

    private transport: TransportService;
    private endpoint: string = '/la';

    public numChans: number;
    public chans: Array<LaChannelComponent> = [];

    constructor(_transport: TransportService, _laInstrumentDescriptor: any) {
        //Store reference to device transport for communication with device
        this.transport = _transport;

        //Populate LA supply parameters
        this.numChans = _laInstrumentDescriptor.numChans;

        //Populate channels  
        _laInstrumentDescriptor.chans.forEach(laChanDescriptor => {
            this.chans.push(new LaChannelComponent(laChanDescriptor));
        })
    }
}
