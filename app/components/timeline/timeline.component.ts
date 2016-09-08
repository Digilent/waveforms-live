import {Component, Input} from '@angular/core';

//Components
import {DeviceComponent} from '../device/device.component';
import {SilverNeedleChart} from '../chart/chart.component';

//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';

@Component({
  templateUrl: 'build/components/timeline/timeline.html',
  selector: 'timeline'
})
export class TimelineComponent { 
    @Input() chart: SilverNeedleChart;
    private deviceManagerService: DeviceManagerService;
    private activeDevice: DeviceComponent;
    
    constructor(_deviceManagerService: DeviceManagerService) {
        this.deviceManagerService = _deviceManagerService;  
        this.activeDevice = this.deviceManagerService.getActiveDevice();
    }

    incrementBuffer() {
        if (parseInt(this.activeDevice.instruments.trigger.activeBuffer) == this.activeDevice.instruments.trigger.dataBufferFillSize) {
            return;
        }
        this.activeDevice.instruments.trigger.activeBuffer = (parseInt(this.activeDevice.instruments.trigger.activeBuffer) + 1).toString();
        this.loadBuffer();
    }

    decrementBuffer() {
        if (parseInt(this.activeDevice.instruments.trigger.activeBuffer) < 2) {
            return;
        }
        this.activeDevice.instruments.trigger.activeBuffer = (parseInt(this.activeDevice.instruments.trigger.activeBuffer) - 1).toString();
        this.loadBuffer();
    }

    activeBufferChange() {
        if (parseInt(this.activeDevice.instruments.trigger.activeBuffer) > this.activeDevice.instruments.trigger.dataBufferFillSize || parseInt(this.activeDevice.instruments.trigger.activeBuffer) < 1 || this.activeDevice.instruments.trigger.activeBuffer === '') {
            this.activeDevice.instruments.trigger.activeBuffer = this.activeDevice.instruments.trigger.dataBufferFillSize.toString();
            console.log('entry error: showing newest buffer');
            this.loadBuffer();
        }
        else {
            this.loadBuffer();
        }
    }

    loadBuffer() {
        let buffNum = parseInt(this.activeDevice.instruments.trigger.activeBuffer) - this.activeDevice.instruments.trigger.dataBufferFillSize;
        let buffCalc = (buffNum + this.activeDevice.instruments.trigger.dataBufferWriteIndex - 1) % 8;
        if (buffCalc < 0) {
            buffCalc += 8;
        }
        console.log('loading buffer: ' + buffCalc);
        for (let i = 0; i < this.activeDevice.instruments.trigger.dataBuffer[buffCalc].length; i++) {
            this.chart.drawWaveform(0, this.activeDevice.instruments.trigger.dataBuffer[buffCalc][i]);
        }
    }
    
}