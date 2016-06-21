import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {OscChannelComponent} from './osc-channel.component';

//Services
import {TransportService} from '../../../services/transport/transport.service';

@Component({
})
export class OscInstrumentComponent {

    private transport: TransportService;
    private endpoint: string = '/osc';

    public numChans: number;
    public chans: Array<OscChannelComponent> = [];

    constructor(_transport: TransportService, _oscInstrumentDescriptor: any) {
        //Store reference to device transport for communication with device
        this.transport = _transport;

        //Populate OSC supply parameters
        this.numChans = _oscInstrumentDescriptor.numChans;

        //Populate channels  
        _oscInstrumentDescriptor.chans.forEach(oscChanDescriptor => {
            this.chans.push(new OscChannelComponent(oscChanDescriptor));
        })
    }
}
