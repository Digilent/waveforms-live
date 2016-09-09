import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {DeviceComponent} from '../../components/device/device.component';

//Services
import {TransportService} from '../transport/transport.service';

@Injectable()
export class DeviceManagerService {

    private transport: TransportService;

    public devices: Array<DeviceComponent> = [];
    public activeDeviceIndex: number;

    constructor() {
        console.log('Device Manager Service Constructor');
        this.transport = new TransportService(null);
    }

    //Connect to device and send enumerate command
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

            this.transport.writeRead('/', JSON.stringify(command), 'json').subscribe(
                (deviceDescriptor) => {
                    let response = JSON.parse(String.fromCharCode.apply(null, new Int8Array(deviceDescriptor.slice(0))));
                    console.log(JSON.stringify(response));
                    let dev = new DeviceComponent(uri, response.device[0]);
                    this.activeDeviceIndex = this.devices.push(dev)-1;
                    console.log(dev);
                    observer.next(this.activeDeviceIndex);
                    observer.complete();
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                     observer.complete();
                });
        });
    }

    //Return active device
    getActiveDevice() {
        return this.devices[this.activeDeviceIndex];
    }

    //Sets active device
    setActiveDevice(_activeDeviceIndex: number) {
        this.activeDeviceIndex = _activeDeviceIndex;
    }
}