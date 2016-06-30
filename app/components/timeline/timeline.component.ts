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
        if (parseInt(this.activeDevice.instruments.osc.activeBuffer) == this.activeDevice.instruments.osc.dataBufferFillSize) {
            return;
        }
        this.activeDevice.instruments.osc.activeBuffer = (parseInt(this.activeDevice.instruments.osc.activeBuffer) + 1).toString();
        this.loadBuffer();
    }

    decrementBuffer() {
        if (this.activeDevice.instruments.osc.activeBuffer === '1') {
            return;
        }
        this.activeDevice.instruments.osc.activeBuffer = (parseInt(this.activeDevice.instruments.osc.activeBuffer) - 1).toString();
        this.loadBuffer();
    }

    activeBufferChange() {
        if (parseInt(this.activeDevice.instruments.osc.activeBuffer) > this.activeDevice.instruments.osc.numDataBuffers || parseInt(this.activeDevice.instruments.osc.activeBuffer) < 0) {
            this.activeDevice.instruments.osc.activeBuffer = this.activeDevice.instruments.osc.dataBufferFillSize.toString();
            console.log('Invalid buffer number. Active buffer set to: ' + this.activeDevice.instruments.osc.activeBuffer);
        }
        else {
            this.loadBuffer();
        }
    }

    loadBuffer() {
        let buffNum = parseInt(this.activeDevice.instruments.osc.activeBuffer) - this.activeDevice.instruments.osc.dataBufferFillSize;
        let buffCalc = (buffNum + this.activeDevice.instruments.osc.dataBufferWriteIndex - 1) % 8;
        if (buffCalc < 0) {
            buffCalc += 8;
        }
        console.log('loading buffer: ' + buffCalc);
        this.chart.drawWaveform(0, this.activeDevice.instruments.osc.dataBuffer[buffCalc][0]);
        this.chart.drawWaveform(1, this.activeDevice.instruments.osc.dataBuffer[buffCalc][1]);
    }
    
}