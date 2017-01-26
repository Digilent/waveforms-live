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
                    catch (e) {
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
        let deviceExistCheck = this.deviceExists(uri, deviceDescriptor);
        if (deviceExistCheck !== -1) {
            this.activeDeviceIndex = deviceExistCheck;
            return;
        }
        let dev = new DeviceComponent(uri, deviceDescriptor.device[0]);
        this.activeDeviceIndex = this.devices.push(dev) - 1;
    }

    deviceExists(uri: string, deviceDescriptor: any) {
        let descriptorString = JSON.stringify(deviceDescriptor.device[0]);
        for (let i = 0; i < this.devices.length; i++) {
            if (JSON.stringify(this.devices[i].descriptorObject) === descriptorString && this.devices[i].rootUri === uri) {
                console.log('device exists!');
                return i;
            }
        }
        return -1;
    }

    xmlToJson(data) {
        let parser = new DOMParser();
        let xmlDoc;
        let contents;
        try {
            xmlDoc = parser.parseFromString(data, "text/xml");
            contents = xmlDoc.getElementsByTagName("Contents");
        }
        catch (e) {
            return e;
        }
        let returnArray: any[] = [];
        for (let i = 0; i < contents.length; i++) {
            returnArray.push({});
            for (let j = 0; j < contents[i].childNodes.length; j++) {
                try {
                    returnArray[i][contents[i].childNodes[j].tagName] = contents[i].childNodes[j].textContent;
                }
                catch (e) {
                    return e;
                }
            }
        }
        return returnArray;
    }

    getLatestFirmwareVersionFromArray(firmwareVersionsArray: any) {
        let arrayToSort: string[] = [];
        for (let i = 0; i < firmwareVersionsArray.length; i++) {
            arrayToSort.push(firmwareVersionsArray[i].Key);
        }
        arrayToSort.sort();
        return arrayToSort[arrayToSort.length - 1].substring(0, arrayToSort[arrayToSort.length - 1].indexOf('.hex'));
    }

    getLatestFirmwareVersionFromUrl(firmwareUrl: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.getFirmwareVersionsFromUrl(firmwareUrl).then((firmwareVersionsArray) => {
                resolve(this.getLatestFirmwareVersionFromArray(firmwareVersionsArray));
            });
        });
    }

    getFirmwareVersionsFromUrl(firmwareUrl: string) {
        this.transport.setHttpTransport(this.transport.getUri());
        return new Promise((resolve, reject) => {
            this.transport.getRequest(firmwareUrl).subscribe(
                (data) => {
                    if (data.indexOf('xml') === -1) {
                        reject('Error');
                    }
                    resolve(this.xmlToJson(data));
                },
                (err) => {
                    console.log(err);
                },
                () => { }
            );
        });
    }
}