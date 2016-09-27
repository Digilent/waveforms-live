import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {LaChannelComponent} from './la-channel.component';
import {InstrumentComponent} from '../instrument.component';

//Services
import {TransportService} from '../../../services/transport/transport.service';

@Component({
})
export class LaInstrumentComponent extends InstrumentComponent {

    public numChans: number;
    public chans: Array<LaChannelComponent> = [];

    constructor(_transport: TransportService, _laInstrumentDescriptor: any) {
        super(_transport, '/')

        //Populate LA supply parameters
        this.numChans = _laInstrumentDescriptor.numChans;

        //Populate channels  
        for (let channel in _laInstrumentDescriptor) {
            if (channel !== 'numChans') {
                this.chans.push(new LaChannelComponent(_laInstrumentDescriptor[channel]));
            }
        }
    }
}
