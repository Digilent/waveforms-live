import {NavParams, ViewController, Platform} from 'ionic-angular';
import {ViewChild, Component} from '@angular/core';

//Components
import {DeviceComponent} from '../../components/device/device.component';

//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';

//Interfaces
import {Chart} from '../../components/chart/chart.interface';
import {SelectedData} from './math-modal.interface';

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
    private chart: Chart;
    private selectedData: SelectedData = {
        instrument: 'osc',
        channel: 1
    };
    private chartMin: number = 0;
    private chartMax: number = 0;
    private minIndex: number = 0;
    private maxIndex: number = 0;

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
        this.calcSelectedRange();
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

    calcSelectedRange() {
        let extremes = this.chart.xAxis[0].getExtremes();
        this.chartMin = extremes.min;
        this.chartMax = extremes.max;
        if (extremes.dataMin > this.chartMin) {
            this.chartMin = extremes.dataMin;
        }
        if (extremes.dataMax < this.chartMax) {
            this.chartMax = extremes.dataMax;
        }
        this.calcDataIndexRange();
    }

    calcDataIndexRange() {
        let seriesNum = this.selectedData.channel - 1;
        this.minIndex = Math.round((this.chartMin - this.chart.series[seriesNum].xData[0]) / this.chart.series[seriesNum].options.pointInterval);
        this.maxIndex = Math.round((this.chartMax - this.chart.series[seriesNum].xData[0]) / this.chart.series[seriesNum].options.pointInterval);
        this.getLocalMax();
        this.getLocalMin();
        this.getAmplitude();
    }
    
    setActiveSeries(channel: string) {
        channel = channel.toLowerCase();
        this.selectedData = {
            instrument: channel.substring(0, channel.length - 2),
            channel: parseInt(channel.slice(-1))
        }
    }

    getMetrics(metric: string) {
        switch (metric) {
            case 'Frequency': 
                return this.getFrequency();
                
            case 'Pos Pulse Width':
                return 'Pos Pulse Width'
                
            case 'Pos Duty Cycle':
                return 'Pos Duty Cycle'
                
            case 'Period':
                return this.getPeriod();

            case 'Neg Pulse Width':
                return 'Neg Pulse Width'
                
            case 'Neg Duty Cycle':
                return 'Neg Duty Cycle'
                
            case 'Rise Rate':
                return 'Rise Rate'
                
            case 'Rise Time':
                return 'Rise Time'
                
            case 'Amplitude':
                return this.getAmplitude();
                
            case 'High':
                return 'High'
                
            case 'Low':
                return 'Low'
                
            case 'Peak to Peak':
                return this.getPeakToPeak();
                
            case 'Maximum':
                return this.getMax();
                
            case 'Minimum':
                return this.getMin();
                
            case 'Mean':
                return this.getMean();
                
            case 'RMS':
                return this.getRMS();
                
            case 'Overshoot':
                return 'Overshoot'
                
            case 'Cycle Mean':
                return 'Cycle Mean'
                
            case 'Cycle RMS':
                return 'Cycle RMS'
                
            case 'Undershoot':
                return 'Undershoot'
                
            default:
                return 'default'
        }
        

    }

    getMax() {
        //Spread operator '...' uses each index as the corresponding parameter in the function
        let activeIndices = this.chart.series[this.selectedData.channel - 1].yData.slice(this.minIndex, this.maxIndex);
        let value = Math.max(...activeIndices);
        let vPerDiv = Math.abs(this.chart.yAxis[this.selectedData.channel - 1].max - this.chart.yAxis[this.selectedData.channel - 1].min) / 10;
        let i = 0;
        let unit = '';
        while (vPerDiv < 1) {
            i++;
            vPerDiv = vPerDiv * 1000;
        }
        if (i == 0) {
            unit = ' V';
        }
        else if (i == 1) {
            unit = ' mV';
        }
        else if (i == 2) {
            unit = ' uV';
        }
        else if (i == 3) {
            unit = ' nV';
        }

        return (value * Math.pow(1000, i)).toFixed(0) + unit;
        
    }

    getMin() {
        let activeIndices = this.chart.series[this.selectedData.channel - 1].yData.slice(this.minIndex, this.maxIndex);
        let value = Math.min(...activeIndices);
        let vPerDiv = Math.abs(this.chart.yAxis[this.selectedData.channel - 1].max - this.chart.yAxis[this.selectedData.channel - 1].min) / 10;
        let i = 0;
        let unit = '';
        while (vPerDiv < 1) {
            i++;
            vPerDiv = vPerDiv * 1000;
        }
        if (i == 0) {
            unit = ' V';
        }
        else if (i == 1) {
            unit = ' mV';
        }
        else if (i == 2) {
            unit = ' uV';
        }
        else if (i == 3) {
            unit = ' nV';
        }

        return (value * Math.pow(1000, i)).toFixed(0) + unit;
    }
    
    getLocalMax() {
        let maxCoordinates = [];
        let detector: boolean = true;
        for (let i = this.minIndex; i < this.maxIndex - 1; i++) {
            if (this.chart.series[this.selectedData.channel - 1].yData[i] - this.chart.series[this.selectedData.channel - 1].yData[i + 1] >= 0 && !detector) {
                maxCoordinates.push({
                    x: this.chart.series[this.selectedData.channel - 1].xData[i],
                    y: this.chart.series[this.selectedData.channel - 1].yData[i]
                });
                detector = true;
            }
            if (this.chart.series[this.selectedData.channel - 1].yData[i] - this.chart.series[this.selectedData.channel - 1].yData[i + 1] < 0 && detector) {
                detector = false;
            }
        }
    }

    getLocalMin() {
        let minCoordinates = [];
        let detector: boolean = true;
        for (let i = this.minIndex; i < this.maxIndex - 1; i++) {
            if (this.chart.series[this.selectedData.channel - 1].yData[i] - this.chart.series[this.selectedData.channel - 1].yData[i + 1] < 0 && !detector) {
                minCoordinates.push({
                    x: this.chart.series[this.selectedData.channel - 1].xData[i],
                    y: this.chart.series[this.selectedData.channel - 1].yData[i]
                });
                detector = true;
            }
            if (this.chart.series[this.selectedData.channel - 1].yData[i] - this.chart.series[this.selectedData.channel - 1].yData[i + 1] >= 0 && detector) {
                detector = false;
            }
        }
    }

    getAmplitude() {
        let max = this.getMax();
        let min = this.getMin();
        let amplitude = (parseFloat(max) - parseFloat(min)) / 2;
        let unit = max.substr(max.indexOf(' '));
        return (amplitude).toFixed(0) + unit;
    }

    getMean() {
        let sum = 0;
        for (let i = this.minIndex; i < this.maxIndex; i++) {
            sum += this.chart.series[this.selectedData.channel - 1].yData[i];
        }
        let value = sum / (this.maxIndex - this.minIndex);
        let vPerDiv = Math.abs(this.chart.yAxis[this.selectedData.channel - 1].max - this.chart.yAxis[this.selectedData.channel - 1].min) / 10;
        let i = 0;
        let unit = '';
        while (vPerDiv < 1) {
            i++;
            vPerDiv = vPerDiv * 1000;
        }
        if (i == 0) {
            unit = ' V';
        }
        else if (i == 1) {
            unit = ' mV';
        }
        else if (i == 2) {
            unit = ' uV';
        }
        else if (i == 3) {
            unit = ' nV';
        }

        return (value * Math.pow(1000, i)).toFixed(0) + unit;
    }

    getRMS() {
        let sum = 0;
        for (let i = this.minIndex; i < this.maxIndex; i++) {
            sum += Math.pow(this.chart.series[this.selectedData.channel - 1].yData[i], 2);
        }
        let value = Math.sqrt(sum / (this.maxIndex - this.minIndex));
        let vPerDiv = Math.abs(this.chart.yAxis[this.selectedData.channel - 1].max - this.chart.yAxis[this.selectedData.channel - 1].min) / 10;
        let i = 0;
        let unit = '';
        while (vPerDiv < 1) {
            i++;
            vPerDiv = vPerDiv * 1000;
        }
        if (i == 0) {
            unit = ' V';
        }
        else if (i == 1) {
            unit = ' mV';
        }
        else if (i == 2) {
            unit = ' uV';
        }
        else if (i == 3) {
            unit = ' nV';
        }
        let scaledValue = (value * Math.pow(1000, i)).toFixed(0) + unit;
        return scaledValue;
    }

    getPeakToPeak() {
        let max = this.getMax();
        let min = this.getMin();
        let unit = max.substr(max.indexOf(' '));
        let p2p = Math.abs(parseFloat(max)) + Math.abs(parseFloat(min));
        return (p2p).toFixed(0) + unit;
    }

    getFrequency() {
        let value = this.chart.series[this.selectedData.channel - 1].yData[this.minIndex];
        let points = [];
        for (let i = this.minIndex; i < this.maxIndex - 1; i++) {
            if (this.chart.series[this.selectedData.channel - 1].yData[i] <= value && this.chart.series[this.selectedData.channel - 1].yData[i + 1] >= value) {
                points.push(this.chart.series[this.selectedData.channel - 1].xData[i]);
            }
        }
        let sum = 0;
        for (let i = 0; i < points.length - 1; i++) {
            sum += (points[i + 1] - points[i]);
        }

        let freqRange = 1 / (sum / (points.length - 1));
        let i = 0;
        let unit = '';
        while (freqRange > 1) {
            i++;
            freqRange = freqRange / 1000;
        }
        i--;
        if (i == 0) {
            unit = ' Hz';
        }
        else if (i == 1) {
            unit = ' kHz';
        }
        else if (i == 2) {
            unit = ' Mhz';
        }
        else if (i == 3) {
            unit = ' GHz';
        }

        let xFreq = ((1 / (sum / (points.length - 1))) / Math.pow(1000, i)).toFixed(0) + unit;

        return xFreq;
    }

    getPeriod() {
        let value = this.chart.series[this.selectedData.channel - 1].yData[this.minIndex];
        let points = [];
        for (let i = this.minIndex; i < this.maxIndex - 1; i++) {
            if (this.chart.series[this.selectedData.channel - 1].yData[i] <= value && this.chart.series[this.selectedData.channel - 1].yData[i + 1] >= value) {
                points.push(this.chart.series[this.selectedData.channel - 1].xData[i]);
            }
        }
        let sum = 0;
        for (let i = 0; i < points.length - 1; i++) {
            sum += (points[i + 1] - points[i]);
        }

        let timeInterval = sum / (points.length - 1);
        let i = 0;
        let unit = '';
        while (timeInterval < 1) {
            i++;
            timeInterval = timeInterval * 1000;
        }
        if (i == 0) {
            unit = ' s';
        }
        else if (i == 1) {
            unit = ' ms';
        }
        else if (i == 2) {
            unit = ' us';
        }
        else if (i == 3) {
            unit = ' ns';
        }
        else if (i == 4) {
            unit = ' ps';
        }

        let xDelta = ((sum / (points.length - 1)) * Math.pow(1000, i)).toFixed(0) + unit;

        return xDelta;
    }
    
}