import {Component} from '@angular/core';

//Components
import {DeviceComponent} from '../../../components/device/device.component';

//Services
import {DeviceManagerService} from '../../../services/device/device-manager.service';

@Component({
    templateUrl: 'awg-test.html'
})
export class AwgTestPage {

    public deviceManagerService: DeviceManagerService;

    public activeDevice: DeviceComponent;

    public targetOffset: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    public readOffsets: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

    constructor(_deviceManagerService: DeviceManagerService) {
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.getActiveDevice();
    }

    enumerate() {
        this.activeDevice.instruments.awg.enumerate().subscribe(
            (descriptor) => {
                console.log('AWG Descriptor: ', descriptor);
            },
            (err) => {
                console.log('AWG enumeration failed.');
            });
    }

}
