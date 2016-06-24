import {Component, Input} from '@angular/core';

//Components
import {DeviceComponent} from '../../../components/device/device.component';

//Services
import {DeviceManagerService} from '../../../services/device/device-manager.service';

@Component({
    templateUrl: 'build/pages/instrument-test-pages/awg-test/awg-test.html'
})
export class AwgTestPage {

    public deviceManagerService: DeviceManagerService;

    private activeDevice: DeviceComponent;

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

    getOffset(chan: number) {
        this.activeDevice.instruments.awg.getOffset(chan).subscribe(
            (offset) => {
                this.readOffsets[chan] = offset/1000;
            },
            (err) => {
                console.log('AWG Read Offset Failed');
            });
    }
    
    setOffset(chans: Array<number>) {
        this.activeDevice.instruments.awg.setOffset(chans).subscribe(
            (status) => {
                //this.readOffsets[chan] = offset/1000;
            },
            (err) => {
                console.log('AWG Set Offset Failed');
            });
    }

}
