import {Component, Input} from '@angular/core';

//Components
import {DeviceComponent} from '../device/device.component';
import {SilverNeedleChart} from '../chart/chart.component';

//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';

@Component({
  templateUrl: 'timeline.html',
  selector: 'timeline'
})
export class TimelineComponent { 
    @Input() chart: SilverNeedleChart;
    public deviceManagerService: DeviceManagerService;
    public activeDevice: DeviceComponent;
    
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
        this.chart.setCurrentBuffer(this.activeDevice.instruments.osc.dataBuffer[buffCalc]);
        let numSeries = [];
        for (let i = 0; i < this.chart.oscopeChansActive.length; i++) {
            if (this.activeDevice.instruments.osc.dataBuffer[buffCalc][i] !== undefined && this.activeDevice.instruments.osc.dataBuffer[buffCalc][i].y !== undefined) {
                numSeries.push(i);
            }
        }
        this.chart.clearExtraSeries(numSeries);
        this.chart.flotDrawWaveform(true, false);
    }
    
}