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

    getOffsets(chans: Array<number>) {
        this.activeDevice.instruments.awg.getOffsets(chans).subscribe(
            (offsets) => {
                offsets.forEach((element, index, array) => {
                    this.readOffsets[chans[index]] = element;
                })
            },
            (err) => {
                console.log('AWG Read Offset Failed');
            });
    }
    
    setOffsets(chans: Array<number>, offsets: Array<number>) {
        //Ensure offsets are numbers
        if (typeof offsets[0] == 'string') {
            offsets.forEach((element, index, array) => {
                array[index] = parseFloat(element);
            });
        }
        
        this.activeDevice.instruments.awg.setOffsets(chans, offsets).subscribe(
            (status) => {
                //this.readOffsets[chan] = offset/1000;
            },
            (err) => {
                console.log('AWG Set Offset Failed');
            });
    }

}
