import {Component, Input} from '@angular/core';

//Components
import {DeviceComponent} from '../../../components/device/device.component';


//Services
import {DeviceManagerService} from '../../../services/device/device-manager.service';

@Component({
    templateUrl: 'build/pages/instrument-test-pages/dc-test/dc-test.html'
})
export class DcTestPage {

    public deviceManagerService: DeviceManagerService;

    private activeDevice: DeviceComponent;
    public targetVoltage: number[] = [0, 0];
    public streamDelay: number[] = [0, 0];
    public dataFrame: number[] = [0, 0];
    @Input() readVoltages: number[] = [0, 0];


    constructor(_deviceManagerService: DeviceManagerService) {
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.getActiveDevice();
    }

    setVoltage(chan: number, voltage: number) {
        console.log('set ', chan, ' ', voltage);
        this.activeDevice.instruments.dc.setVoltage(chan, voltage).subscribe(
            (data) => {
                if (data.statusCode == 0) {
                    console.log('DC Supply channel ', chan, ' set to ', voltage, 'v');
                }
                else {
                    console.log('Set Failed');
                }
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );

        console.log('Channel: ', chan, ' => ', Math.round(voltage * 1000));
    }

    getVoltage(chan: number) {
        console.log('get ', chan);
        this.activeDevice.instruments.dc.getVoltage(chan).subscribe(
            (data) => {
                this.readVoltages[chan] = data;
                this.dataFrame[chan]++;
                console.log('Frame: ', this.dataFrame[chan]);
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => {
                console.log('getVoltage Done');
            }
        )
    }

    streamVoltage(chan: number) {
        console.log('Stream Read Chan: ', chan);
        this.activeDevice.instruments.dc.streamVoltage(chan, this.streamDelay[chan]).subscribe(
            (data) => {
                this.readVoltages[chan] = data;
                this.dataFrame[chan]++;
                console.log('Frame: ', this.dataFrame[chan]);
            },
            (err) => {
                console.log(err);
            },
             () => {
                console.log('streamVoltage Done');
            }
        )
    }

    stopStream() {
        this.activeDevice.instruments.dc.stopStream();
    }
}
