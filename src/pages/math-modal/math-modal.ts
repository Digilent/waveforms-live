import { NavParams, ViewController, Platform, PopoverController } from 'ionic-angular';
import { Component } from '@angular/core';

//Components
import { SilverNeedleChart } from '../../components/chart/chart.component';
import { GenPopover } from '../../components/gen-popover/gen-popover.component';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';

//Interfaces
import { Chart } from '../../components/chart/chart.interface';
import { SelectedData } from './math-modal.interface';

//Pipes
import { UnitFormatPipe } from '../../pipes/unit-format.pipe';

declare var mathFunctions: any;

@Component({
    templateUrl: "math-modal.html"
})

export class MathModalPage {
    public popoverCtrl: PopoverController;
    public chartComponent: SilverNeedleChart;
    public platform: Platform;
    public viewCtrl: ViewController;
    public params: NavParams;
    public deviceManagerService: DeviceManagerService;
    public activeDevice: DeviceService;
    public mathChannels: string[];
    public buttonNames: Array<string[]> = [['Frequency', 'Period'], ['Amplitude', 'Peak to Peak'], ['Maximum', 'Minimum'], ['Mean', 'RMS']];
    public chart: Chart;
    public selectedData: SelectedData = {
        instrument: 'Osc',
        channel: 1
    };
    public chartMin: number = 0;
    public chartMax: number = 0;
    public minIndex: number = 0;
    public maxIndex: number = 0;
    public activeChannels: boolean[] = [];
    public unitFormatPipe: UnitFormatPipe;

    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams,
        _popoverCtrl: PopoverController,
        _deviceManagerService: DeviceManagerService
    ) {
        this.popoverCtrl = _popoverCtrl;
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.chartComponent = this.params.get('chartComponent');
        this.chart = this.chartComponent.chart;
        this.unitFormatPipe = new UnitFormatPipe();
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
        this.mathChannels = [];
        for (let i = 0; i < this.activeDevice.instruments.osc.chans.length; i++) {
            this.mathChannels.push('Osc Ch ' + (i + 1));
            this.activeChannels.push(this.chartComponent.currentBufferArray[i] !== undefined && this.chartComponent.currentBufferArray[i].y !== undefined);
        }
        this.selectedData.channel = this.activeChannels.indexOf(true) + 1;
        console.log('about to calc range');
        this.calcSelectedRange();
    }

    openChannelSelect(event) {
        let dataArray = [];
        for (let i = 0; i < this.mathChannels.length; i++) {
            if (this.activeChannels[i]) {
                dataArray.push(this.mathChannels[i]);
            }
        }
        let popover = this.popoverCtrl.create(GenPopover, {
            dataArray: dataArray
        });
        popover.onWillDismiss((data) => {
            if (data == null) { return; }
            this.setActiveSeries(data.option);
        });
        popover.present({
            ev: event
        });
    }

    calcSelectedRange() {
        let extremes = this.chart.getAxes().xaxis;
        this.chartMin = extremes.min;
        this.chartMax = extremes.max;
        this.calcDataIndexRange();
    }

    calcDataIndexRange() {
        let seriesNum = this.selectedData.channel - 1;
        let series = this.chart.getData();
        console.log(series);
        this.minIndex = Math.round((this.chartMin - series[seriesNum].data[0][0]) / (series[seriesNum].data[1][0] - series[seriesNum].data[0][0]));
        this.maxIndex = Math.round((this.chartMax - series[seriesNum].data[0][0]) / (series[seriesNum].data[1][0] - series[seriesNum].data[0][0]));
        if (this.minIndex < 0) {
            this.minIndex = 0;
        }
        if (this.minIndex > series[seriesNum].data.length) {
            this.minIndex = series[seriesNum].data.length - 1;
        }
        if (this.maxIndex < 0) {
            this.maxIndex = 0;
        }
        if (this.maxIndex > series[seriesNum].data.length) {
            this.maxIndex = series[seriesNum].data.length - 1;
        }
    }

    setActiveSeries(selection: string) {
        let infoSplit = selection.split(' ');
        this.selectedData = {
            instrument: infoSplit[0],
            channel: parseInt(infoSplit[2])
        }
    }

    getMetrics(metric: string) {
        switch (metric) {
            case 'Frequency':
                return this.unitFormatPipe.transform(mathFunctions.getFrequency(this.chart, this.selectedData.channel - 1, this.minIndex, this.maxIndex), 'Hz');

            case 'Pos Pulse Width':
                return 'Pos Pulse Width'

            case 'Pos Duty Cycle':
                return 'Pos Duty Cycle'

            case 'Period':
                return this.unitFormatPipe.transform(mathFunctions.getPeriod(this.chart, this.selectedData.channel - 1, this.minIndex, this.maxIndex), 's');

            case 'Neg Pulse Width':
                return 'Neg Pulse Width'

            case 'Neg Duty Cycle':
                return 'Neg Duty Cycle'

            case 'Rise Rate':
                return 'Rise Rate'

            case 'Rise Time':
                return 'Rise Time'

            case 'Amplitude':
                return this.unitFormatPipe.transform(mathFunctions.getAmplitude(this.chart, this.selectedData.channel - 1, this.minIndex, this.maxIndex), 'V');

            case 'High':
                return 'High'

            case 'Low':
                return 'Low'

            case 'Peak to Peak':
                return this.unitFormatPipe.transform(mathFunctions.getPeakToPeak(this.chart, this.selectedData.channel - 1, this.minIndex, this.maxIndex), 'Vpp');

            case 'Maximum':
                return this.unitFormatPipe.transform(mathFunctions.getMax(this.chart, this.selectedData.channel - 1, this.minIndex, this.maxIndex), 'V');

            case 'Minimum':
                return this.unitFormatPipe.transform(mathFunctions.getMin(this.chart, this.selectedData.channel - 1, this.minIndex, this.maxIndex), 'V');

            case 'Mean':
                return this.unitFormatPipe.transform(mathFunctions.getMean(this.chart, this.selectedData.channel - 1, this.minIndex, this.maxIndex), 'V');

            case 'RMS':
                return this.unitFormatPipe.transform(mathFunctions.getRMS(this.chart, this.selectedData.channel - 1, this.minIndex, this.maxIndex), 'V');

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