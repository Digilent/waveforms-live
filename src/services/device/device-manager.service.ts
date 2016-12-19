import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import { DeviceComponent } from '../../components/device/device.component';

//Services
import { TransportService } from '../transport/transport.service';

//Interfaces
import { MyEventResponse } from '../../components/transport/http-transport.interface';

@Injectable()
export class DeviceManagerService {

    public transport: TransportService;

    public devices: Array<DeviceComponent> = [];
    public activeDeviceIndex: number;

    constructor() {
        console.log('Device Manager Service Constructor');
        this.transport = new TransportService(null);
    }

    //Connect to device and send enumerate command
    connect(uri): Observable<any> {
        return Observable.create((observer) => {
            this.transport.setHttpTransport(uri);

            let command = {
                'device': [
                    {
                        command: 'enumerate'
                    }
                ]
            }

            this.transport.writeRead('/', JSON.stringify(command), 'json').subscribe(
                (deviceDescriptor) => {
                    let response;
                    try {
                        response = JSON.parse(String.fromCharCode.apply(null, new Int8Array(deviceDescriptor.slice(0))));
                    }
                    catch (error) {
                        observer.error(error);
                    }
                    console.log(response);

                    observer.next(response);
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

    connectBridge(uri: string): Observable<any> {
        return Observable.create((observer) => {

            this.transport.setHttpTransport(uri);
            let command = {
                "agent": [
                    {
                        "command": "enumerateDevices"
                    }
                ]
            };

            this.transport.writeRead('/config', JSON.stringify(command), 'json').subscribe(
                (data) => {
                    let response;
                    try {
                        response = JSON.parse(String.fromCharCode.apply(null, new Int8Array(data.slice(0))));
                    }
                    catch (error) {
                        observer.error(error);
                    }
                    console.log(response);

                    observer.next(response);
                    observer.complete();
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            );
        });
    }

    connectLocal(deviceName: string): Observable<any> {
        return Observable.create((observer) => {
            if (deviceName === 'OpenScope-MZ') {
                let XHR = new XMLHttpRequest();
                // We define what will happen if the data are successfully sent
                XHR.addEventListener("load", function (event: MyEventResponse) {
                    let enumerationObject;
                    try {
                        enumerationObject = JSON.parse(event.currentTarget.response);
                    }
                    catch(e) {
                        observer.error(e);
                        return;
                    }
                    this.transport.setLocalTransport(enumerationObject);
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
                            console.log(response);
                            observer.next(response);
                            observer.complete();
                        },
                        (err) => {
                            observer.error(err);
                        },
                        () => {
                            observer.complete();
                        });
                }.bind(this));

                // We define what will happen in case of error
                XHR.addEventListener("error", function (event) {
                    observer.error('TX Error: ', event);
                });


                // We set up our request
                XHR.open("GET", 'assets/devices/openscope-mz/descriptor.json');

                XHR.send();
            }
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

    addDeviceFromDescriptor(uri: string, deviceDescriptor: any) {
        let dev = new DeviceComponent(uri, deviceDescriptor.device[0]);
        this.activeDeviceIndex = this.devices.push(dev) - 1;
    }
}