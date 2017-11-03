import { Component } from '@angular/core';
import { NavParams, ViewController, PopoverController } from 'ionic-angular';
import { Subject } from 'rxjs/Subject';

//Components
import { GenPopover } from '../../components/gen-popover/gen-popover.component';

//Interfaces
import { Chart } from 'digilent-chart-angular2/modules';

//Pipes
import { UnitFormatPipe } from '../../pipes/unit-format.pipe';

declare var mathFunctions: any;

@Component({
    templateUrl: 'math-popover.html'
})
export class MathPopoverComponent {
    public buttonNames: Array<MathInfoType[]> = [['Frequency', 'Period'], ['Amplitude', 'Peak to Peak'], ['Maximum', 'Minimum'], ['Mean', 'RMS']];
    public chart: Chart;
    public chartMin: number = 0;
    public chartMax: number = 0;
    public minIndex: number = 0;
    public maxIndex: number = 0;
    public unitFormatPipe: UnitFormatPipe;
    public buttonSubject: Subject<MathOutput> = new Subject<MathOutput>();

    public passData: MathPassData;
    private possibleChannelSelections: string[] = [];
    public selectedChan: MathChannel;

    constructor(
        private viewCtrl: ViewController,
        private params: NavParams,
        private popoverCtrl: PopoverController
    ) {
        this.passData = this.params.get('passData');
        console.log(this.passData);
        this.selectedChan = this.passData.selectedChan;
        this.chart = this.passData.chart;
        this.generatePossibleSelections();
        console.log(this.possibleChannelSelections);
        this.unitFormatPipe = new UnitFormatPipe();
        this.calcSelectedRange();
    }

    private generatePossibleSelections() {
        this.passData.availableChans.forEach((data, index, array) => {
            this.possibleChannelSelections.push(data.instrument + ' Ch ' + data.channel);
        });
    }

    openChannelSelect(event) {
        let popover = this.popoverCtrl.create(GenPopover, {
            dataArray: this.possibleChannelSelections
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
        let seriesNum = this.selectedChan.seriesOffset;
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
        let seriesOffset;
        this.passData.availableChans.forEach((chanInfo) => {
            if (chanInfo.instrument === infoSplit[0] && chanInfo.channel === parseInt(infoSplit[2])) {
                seriesOffset = chanInfo.seriesOffset;
            }
        });
        this.selectedChan = {
            instrument: infoSplit[0],
            channel: parseInt(infoSplit[2]),
            seriesOffset: seriesOffset
        }
    }

    getMetrics(metric: MathInfoType | any) {
        switch (metric) {
            case 'Frequency':
                return this.unitFormatPipe.transform(mathFunctions.getFrequency(this.chart, this.selectedChan.seriesOffset, this.minIndex, this.maxIndex), 'Hz');

            case 'Pos Pulse Width':
                return 'Pos Pulse Width'

            case 'Pos Duty Cycle':
                return 'Pos Duty Cycle'

            case 'Period':
                return this.unitFormatPipe.transform(mathFunctions.getPeriod(this.chart, this.selectedChan.seriesOffset, this.minIndex, this.maxIndex), 's');

            case 'Neg Pulse Width':
                return 'Neg Pulse Width'

            case 'Neg Duty Cycle':
                return 'Neg Duty Cycle'

            case 'Rise Rate':
                return 'Rise Rate'

            case 'Rise Time':
                return 'Rise Time'

            case 'Amplitude':
                return this.unitFormatPipe.transform(mathFunctions.getAmplitude(this.chart, this.selectedChan.seriesOffset, this.minIndex, this.maxIndex), 'V');

            case 'High':
                return 'High'

            case 'Low':
                return 'Low'

            case 'Peak to Peak':
                return this.unitFormatPipe.transform(mathFunctions.getPeakToPeak(this.chart, this.selectedChan.seriesOffset, this.minIndex, this.maxIndex), 'Vpp');

            case 'Maximum':
                return this.unitFormatPipe.transform(mathFunctions.getMax(this.chart, this.selectedChan.seriesOffset, this.minIndex, this.maxIndex), 'V');

            case 'Minimum':
                return this.unitFormatPipe.transform(mathFunctions.getMin(this.chart, this.selectedChan.seriesOffset, this.minIndex, this.maxIndex), 'V');

            case 'Mean':
                return this.unitFormatPipe.transform(mathFunctions.getMean(this.chart, this.selectedChan.seriesOffset, this.minIndex, this.maxIndex), 'V');

            case 'RMS':
                return this.unitFormatPipe.transform(mathFunctions.getRMS(this.chart, this.selectedChan.seriesOffset, this.minIndex, this.maxIndex), 'V');

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

    exportMathInfoToChart(info: MathInfoType) {
        this.buttonSubject.next({
            mathInfo: info,
            mathChannel: this.selectedChan,
            maxIndex: this.maxIndex,
            minIndex: this.minIndex,
            value: this.getMetrics(info)
        });
    }
}

export interface MathPassData {
    chart: Chart,
    availableChans: MathChannel[],
    selectedChan: MathChannel,
    addedInfo: MathInfoType[]
}

export interface MathChannel {
    instrument: string, 
    channel: number, 
    seriesOffset: number
}

export type MathInfoType = 'Frequency' | 'Period' | 'Amplitude' | 'Peak to Peak' | 'Maximum' | 'Minimum' | 'Mean' | 'RMS';

export interface MathOutput {
    mathInfo: MathInfoType,
    mathChannel: MathChannel,
    maxIndex: number,
    minIndex: number,
    value: string
}