import {Injectable} from '@angular/core';
import {Http, HTTP_PROVIDERS} from '@angular/http';

//Components
import {DeviceComponent} from '../../components/device/device.component';

//Services
import {TransportService} from '../transport/transport.service';

@Injectable()
export class DeviceManagerService {

    private transport: TransportService;
    private http: Http;

    public devices: DeviceComponent[] = [];
    public activeDeviceIndex: number;
    public connectedDeviceIndex = -1;

    constructor(_http: Http) {
        console.log('Device Manager Service Constructor');
        this.http = _http;
        this.transport = new TransportService(_http, null);        
    }

    connect(uri) {        
        this.transport.setUri(uri);
        
        let command = {
            command: "enumerate"
        }
        
        this.transport.writeRead('/', command).subscribe(
            (data) => {
                console.log(data._body);
                let deviceDescriptor = JSON.parse(data._body);
                console.log(deviceDescriptor);
                let dev = new DeviceComponent(this.http, uri, deviceDescriptor);
                this.devices.push(dev);
                this.activeDeviceIndex = 0;
            },
            (err) => {
                console.log(err);
            },
            () => {
                console.log('done');
                //Complete
            });
    }
}