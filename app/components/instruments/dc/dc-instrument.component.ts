import {Component} from '@angular/core';

//Components
import {DcChannelComponent} from './dc-channel.component';

//Services
import {TransportService} from '../../../services/transport/transport.service';

@Component({
})
export class DcInstrumentComponent {

    private transport: TransportService;
    private endpoint: string = '/dc';

    public numChans: number;
    public chans: DcChannelComponent[] = [];

    constructor(_transport: TransportService, dcInstrumentDescriptor: any) {
        //Store reference to device transport for communication with device
        this.transport = _transport;
        
        //Populate DC supply parameters
        this.numChans = dcInstrumentDescriptor.numChans;

        //Populate channels        
        dcInstrumentDescriptor.chans.forEach(dcChanDescriptor => {
            this.chans.push(new DcChannelComponent(dcChanDescriptor));
        })
    }

    //Calibrate the DC power supply.
    //TODO
    
    //Enumerate instrument info.
    enumerate() {
        let command = {
            command: 'enumerate'
        }
        return this.transport.writeRead(this.endpoint, command);
    }

    //Get the output voltage of the specified DC power supply channel.
    getVoltage(_chan: number) {
        let command = {
            command: "getVoltage",
            chan: _chan
        }

        return this.transport.writeRead(this.endpoint, command);
    }

    //Set the output voltage of the specified DC power supply channel.
    setVoltage(_chan: number) {
        let command = {
            command: "setVoltage",
            chan: _chan
        }

        return this.transport.writeRead(this.endpoint, command);
    }
}