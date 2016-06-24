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
    public bulkReadChannelsEnabled: boolean[] = [false, false, false, false, false, false, false, false];
    
    @Input() readVoltages: number[] = [0, 0];
    


    constructor(_deviceManagerService: DeviceManagerService) {
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.getActiveDevice();
    }
    
    setVoltage(chan, voltage){
        let chans = [chan];
        let voltages = [voltage];
        this.setVoltages(chans, voltages);
    }
    setVoltages(_chans: Array<number>, _voltages: Array<number>) {
        console.log('set ', _chans, ' ', _voltages);
        this.activeDevice.instruments.dc.setVoltages(_chans, _voltages).subscribe(
            (data) => {
                if (data.statusCode == 0) {
                    console.log('DC Supply channel ', _chans, ' set to ', _voltages, 'v');
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
    }
    
    bulkRead(){
        let chans = [];
        this.bulkReadChannelsEnabled.forEach((element, index) => {
            if(element == true){
                chans.push(index);
            }
        });
        this.getVoltages(chans);
    }

    getVoltages(chans: Array<number>) {
        this.activeDevice.instruments.dc.getVoltages(chans).subscribe(
            (voltages) => {
                voltages.forEach((element, index, array) => {
                    this.readVoltages[chans[index]] = voltages[index];
                }) 
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
