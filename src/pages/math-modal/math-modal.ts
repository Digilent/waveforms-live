import {NavParams, ViewController, Platform} from 'ionic-angular';
import {Component} from '@angular/core';

//Components
import {DeviceComponent} from '../../components/device/device.component';
import {SilverNeedleChart} from '../../components/chart/chart.component';

//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';

//Interfaces
import {Chart} from '../../components/chart/chart.interface';
import {SelectedData} from './math-modal.interface';

@Component({
    templateUrl: "math-modal.html"
})

export class MathModalPage {
    public chartComponent: SilverNeedleChart;
    public platform: Platform;
    public viewCtrl: ViewController;
    public params: NavParams;
    public deviceManagerService: DeviceManagerService;
    public activeDevice: DeviceComponent;
    public mathChannels: string[];
    public buttonNames: Array<string[]> = [['Frequency', 'Period', 'Amplitude'], ['Peak to Peak', 'Maximum', 'Minimum'], ['Mean', 'RMS']];
    public chart: Chart;
    public selectedData: SelectedData = {
        instrument: 'osc',
        channel: 1
    };
    public chartMin: number = 0;
    public chartMax: number = 0;
    public minIndex: number = 0;
    public maxIndex: number = 0;
    public activeChannels: boolean[] = [];

    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams,
        _deviceManagerService: DeviceManagerService
    ) {
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.chartComponent = this.params.get('chartComponent');
        this.chart = this.chartComponent.chart;
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
        this.mathChannels = [];
        for (let i = 0; i < this.activeDevice.instruments.osc.chans.length; i++) {
            this.mathChannels.push('Osc ' + (i + 1));
            this.activeChannels.push(this.chartComponent.currentBufferArray[i] !== undefined && this.chartComponent.currentBufferArray[i].y !== undefined);
        }
        this.selectedData.channel = this.activeChannels.indexOf(true) + 1;
        this.calcSelectedRange();
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
                return this.chartComponent.getFrequency(this.selectedData.channel - 1, this.maxIndex, this.minIndex);
                
            case 'Pos Pulse Width':
                return 'Pos Pulse Width'
                
            case 'Pos Duty Cycle':
                return 'Pos Duty Cycle'
                
            case 'Period':
                return this.chartComponent.getPeriod(this.selectedData.channel - 1, this.maxIndex, this.minIndex);

            case 'Neg Pulse Width':
                return 'Neg Pulse Width'
                
            case 'Neg Duty Cycle':
                return 'Neg Duty Cycle'
                
            case 'Rise Rate':
                return 'Rise Rate'
                
            case 'Rise Time':
                return 'Rise Time'
                
            case 'Amplitude':
                return this.chartComponent.getAmplitude(this.selectedData.channel - 1, this.maxIndex, this.minIndex);
                
            case 'High':
                return 'High'
                
            case 'Low':
                return 'Low'
                
            case 'Peak to Peak':
                return this.chartComponent.getPeakToPeak(this.selectedData.channel - 1, this.maxIndex, this.minIndex);
                
            case 'Maximum':
                return this.chartComponent.getMax(this.selectedData.channel - 1, this.maxIndex, this.minIndex);
                
            case 'Minimum':
                return this.chartComponent.getMin(this.selectedData.channel - 1, this.maxIndex, this.minIndex);
                
            case 'Mean':
                return this.chartComponent.getMean(this.selectedData.channel - 1, this.maxIndex, this.minIndex);
                
            case 'RMS':
                return this.chartComponent.getRMS(this.selectedData.channel - 1, this.maxIndex, this.minIndex);
                
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

    exportMathInfoToChart(info: string) {
        this.chartComponent.addMathInfo(info, this.selectedData.channel - 1, this.maxIndex, this.minIndex);
    }
    
}