import {Injectable} from '@angular/core';
import {Http, HTTP_PROVIDERS} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {DeviceComponent} from '../../components/device/device.component';

//Services
import {TransportService} from '../transport/transport.service';

@Injectable()
export class DeviceManagerService {

    private transport: TransportService;
    private http: Http;

    public devices: Array<DeviceComponent> = [];
    public activeDeviceIndex: number;

    constructor(_http: Http) {
        console.log('Device Manager Service Constructor');
        this.http = _http;
        this.transport = new TransportService(_http, null);
    }

    connect(uri): Observable<any> {
        return Observable.create((observer) => {
            this.transport.setUri(uri);

            let command = {
                'device': [
                    {
                        command: 'enumerate'
                    }
                ]
            }

            this.transport.writeRead('/', JSON.stringify(command)).subscribe(
                (deviceDescriptor) => {
                    console.log('Device Manager: ', deviceDescriptor);
                    let response = JSON.parse(String.fromCharCode.apply(null, new Int8Array(deviceDescriptor.slice(0))));
                    console.log(response);
                    let dev = new DeviceComponent(this.http, uri, response.device[0]);
                    this.activeDeviceIndex = this.devices.push(dev)-1;
                    console.log(this.devices);
                    observer.next(this.activeDeviceIndex);
                    observer.complete();
                },
                (err) => {
                    console.log(err);
                    observer.error(err);
                },
                () => {
                     observer.complete();
                });
        });
    }

    getActiveDevice() {
        return this.devices[this.activeDeviceIndex];
    }

    setActiveDevice(_activeDeviceIndex: number) {
        this.activeDeviceIndex = _activeDeviceIndex;
    }
}