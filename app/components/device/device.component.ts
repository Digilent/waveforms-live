import {Component} from '@angular/core';

//Components
import {AwgInstrumentComponent} from '../instruments/awg/awg-instrument.component';
import {DcInstrumentComponent} from '../instruments/dc/dc-instrument.component';
import {LaInstrumentComponent} from '../instruments/la/la-instrument.component';
import {OscInstrumentComponent} from '../instruments/osc/osc-instrument.component';
import {TriggerInstrumentComponent} from '../instruments/trigger/trigger-instrument.component';

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
        trigger: TriggerInstrumentComponent
    } = {
        awg: null,
        dc: null,
        la: null,
        osc: null,
        trigger: null
    };

    constructor(_rootUri: string, deviceDescriptor: any) {
        console.log('Device Contructor');
        console.log(deviceDescriptor);
        //TODO If deviceDescriptor is empty, attempt to enumerate the deviceDescriptor [?]

        this.rootUri = _rootUri;
        this.transport = new TransportService(this.rootUri);
        this.deviceMake = deviceDescriptor.deviceMake;
        this.deviceModel = deviceDescriptor.deviceModel;
        this.firmwareVersion = deviceDescriptor.firmwareVersion;
        console.log(this, deviceDescriptor);
        this.instruments.awg = new AwgInstrumentComponent(this.transport, deviceDescriptor.awg);
        this.instruments.dc = new DcInstrumentComponent(this.transport, deviceDescriptor.dc);
        this.instruments.la = new LaInstrumentComponent(this.transport, deviceDescriptor.la);
        this.instruments.osc = new OscInstrumentComponent(this.transport, deviceDescriptor.osc);
        this.instruments.trigger = new TriggerInstrumentComponent(this.transport, 'deviceDescriptor.trigger');
    }


}