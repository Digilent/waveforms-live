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
}
