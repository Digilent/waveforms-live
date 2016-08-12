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

    playBuffers() {
        console.log(this.activeDevice.instruments);
        for (let i = 1; i <= this.activeDevice.instruments.osc.dataBufferFillSize; i++) {
            this.activeDevice.instruments.osc.activeBuffer = i.toString();
            console.log('Active Buffer = ' + this.activeDevice.instruments.osc.activeBuffer);
            this.loadBuffer();
        }
    }

    incrementBuffer() {
        if (parseInt(this.activeDevice.instruments.osc.activeBuffer) == this.activeDevice.instruments.osc.dataBufferFillSize) {
            return;
        }
        this.activeDevice.instruments.osc.activeBuffer = (parseInt(this.activeDevice.instruments.osc.activeBuffer) + 1).toString();
        this.loadBuffer();
    }

    decrementBuffer() {
        if (parseInt(this.activeDevice.instruments.osc.activeBuffer) < 2) {
            return;
        }
        this.activeDevice.instruments.osc.activeBuffer = (parseInt(this.activeDevice.instruments.osc.activeBuffer) - 1).toString();
        this.loadBuffer();
    }

    activeBufferChange() {
        if (parseInt(this.activeDevice.instruments.osc.activeBuffer) > this.activeDevice.instruments.osc.dataBufferFillSize || parseInt(this.activeDevice.instruments.osc.activeBuffer) < 1 || this.activeDevice.instruments.osc.activeBuffer === '') {
            this.activeDevice.instruments.osc.activeBuffer = this.activeDevice.instruments.osc.dataBufferFillSize.toString();
            console.log('entry error: showing newest buffer');
            this.loadBuffer();
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