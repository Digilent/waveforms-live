import {NavParams, ViewController, Platform} from 'ionic-angular';
import {ViewChild, Component} from '@angular/core';

//Components
import {DeviceComponent} from '../../components/device/device.component';

//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';

@Component({
    templateUrl: "build/pages/math-modal/math-modal.html"
})
export class MathModalPage {
    private platform: Platform;
    private viewCtrl: ViewController;
    private params: NavParams;
    private deviceManagerService: DeviceManagerService;
    private activeDevice: DeviceComponent;
    private mathChannels: string[];
    private buttonNames: Array<string[]> = [['Frequency', 'Pos Pulse Width', 'Pos Duty Cycle'], ['Period', 'Neg Pulse Width', 'Neg Duty Cycle'], 
        ['Rise Rate', 'Rise Time'], ['Amplitude', 'High', 'Low'], ['Peak to Peak', 'Maximum', 'Minimum'], ['Mean', 'RMS', 'Overshoot'], ['Cycle Mean', 'Cycle RMS', 'Undershoot']];
    private chart: Object;
    private selectedData: Object = {
        instrument: 'osc',
        channel: '1'
    };

    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams,
        _deviceManagerService: DeviceManagerService
    ) {
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.chart = this.params.get('chart');
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
        this.mathChannels = [];
        for (let i = 0; i < this.activeDevice.instruments.osc.chans.length; i++) {
            this.mathChannels.push('Osc ' + (i + 1));
        }
    }

    //Close modal and save settings if they are changed
    closeModal(save: boolean) {
        this.viewCtrl.dismiss();
    }
    
    setActiveSeries(channel: string) {
        channel = channel.toLowerCase();
        this.selectedData = {
            instrument: channel.substring(0, channel.length - 2),
            channel: channel.slice(-1)
        }
    }

    getMetrics(index: number) {
        switch (index) {
            case 0: 
                console.log('hey');
                break;
            case 1:
                console.log(1);
                break;
            default:
                console.log('default');
        }
        

    }

    getMax() {
        //Spread operator '...' uses each index as the corresponding parameter in the function
        return Math.max(...this.chart.series[this.selectedData.channel - 1].yData);
    }

    getMin() {
        return Math.min(...this.chart.series[this.selectedData.channel - 1].yData);
    }
    
    
}