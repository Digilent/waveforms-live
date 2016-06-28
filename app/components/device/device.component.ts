import {Component} from '@angular/core';
import {Http, HTTP_PROVIDERS} from '@angular/http';

//Components
import {AwgInstrumentComponent} from '../instruments/awg/awg-instrument.component';
import {DcInstrumentComponent} from '../instruments/dc/dc-instrument.component';
import {LaInstrumentComponent} from '../instruments/la/la-instrument.component';
import {OscInstrumentComponent} from '../instruments/osc/osc-instrument.component';

//Services
import {TransportService} from '../../services/transport/transport.service';

@Component({
})
export class DeviceComponent {

    private transport;

    private rootUri: string;
    public deviceMake: string;
    public deviceModel: string;
    public firmwareVersion;
    public instruments: {
        awg: AwgInstrumentComponent,
        dc: DcInstrumentComponent,
        la: LaInstrumentComponent,
        osc: OscInstrumentComponent,
    } = {
        awg: null,
        dc: null,
        la: null,
        osc: null
    };

    constructor(_http: Http, _rootUri: string, deviceDescriptor: any) {
        console.log('Device Contructor');
        //TODO If deviceDescriptor is empty attempt to enumerate the deviceDescriptor

        this.rootUri = _rootUri;
        this.transport = new TransportService(_http, this.rootUri);
        this.deviceMake = deviceDescriptor.deviceMake;
        this.deviceModel = deviceDescriptor.deviceModel;
        this.firmwareVersion = deviceDescriptor.firmwareVersion;

        this.instruments.awg = new AwgInstrumentComponent(this.transport, deviceDescriptor.instruments.awg);
        this.instruments.dc = new DcInstrumentComponent(this.transport, deviceDescriptor.instruments.dc);
        this.instruments.la = new LaInstrumentComponent(this.transport, deviceDescriptor.instruments.la);
        this.instruments.osc = new OscInstrumentComponent(this.transport, deviceDescriptor.instruments.osc);
    }


}