import {Component, Input} from '@angular/core';

//Components
import {DeviceComponent} from '../../../components/device/device.component';

//Services
import {DeviceManagerService} from '../../../services/device/device-manager.service';

@Component({
    templateUrl: 'build/pages/instrument-test-pages/osc-test/osc-test.html'
})
export class OscTestPage {

    public deviceManagerService: DeviceManagerService;
    public chanEnabled: Array<Boolean> = [false, false];

    private activeDevice: DeviceComponent;

    constructor(_deviceManagerService: DeviceManagerService) {
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.getActiveDevice();
    }

    enumerate() {
        this.activeDevice.instruments.osc.enumerate().subscribe(
            (descriptor) => {
                console.log('OSC Descriptor: ', descriptor);
            },
            (err) => {
                console.log('OSC enumeration failed.');
            });
    }

    runSingle(chans: Array<number>) {
        //console.log('name: ', this.activeDevice.instruments.osc.chans[i].name) ;
        this.activeDevice.instruments.osc.runSingle(chans).subscribe(
            (buffer) => {
                console.log(this.activeDevice.instruments.osc.dataBuffer);
            },
            (err) => {
                console.log('OSC Run Single Failed.');
            }
        );
    }


    runSingleNChans() {
        console.log(this.chanEnabled);

        let chans = [];
        this.chanEnabled.forEach((element, index) => {
            if (element == true) {
                chans.push(index);
            }
        });
        this.runSingle(chans);
    }



    streamNChans(chans: Array<number>) {
        this.activeDevice.instruments.osc.streamRunSingle(chans).subscribe(
            (buffer) => {
                console.log(this.activeDevice.instruments.osc.dataBuffer);
            },
            (err) => {
                console.log('OSC Run Single Failed.');
            }
        );
    }

    streamSingleNChans() {
        console.log(this.chanEnabled);

        let chans = [];
        this.chanEnabled.forEach((element, index) => {
            if (element == true) {
                chans.push(index);
            }
        });
        this.streamNChans(chans);
    }


    stopStream() {
        this.activeDevice.instruments.dc.stopStream();
    }


}
