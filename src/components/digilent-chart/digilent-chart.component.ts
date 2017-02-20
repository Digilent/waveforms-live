import { Component, Output, Input, EventEmitter } from '@angular/core';

//Interfaces
import { Chart, DataContainer } from '../chart/chart.interface';

//Pipes
import { UnitFormatPipe } from '../../pipes/unit-format.pipe';

declare var $: any;

@Component({
    selector: 'digilent-chart',
    templateUrl: 'digilent-chart.html'
})

export class DigilentChart {
    @Output() chartLoad: EventEmitter<any> = new EventEmitter();
    @Input() chartId: string;
    @Input() flotOptions: any;
    @Input() chartType: 'standard'|'log'|'semilogX'|'semilogY';
    public unitFormatPipeInstance = new UnitFormatPipe();
    public digilentChart: Chart;
    private initialChartLoad: boolean = true;

    constructor() { }

    ngAfterViewInit() {
        console.log('View Init');
        let plotArea = $('#' + this.chartId);
        plotArea.css({
            width: '100%',
            height: '100%'
        });
        if (this.digilentChart == undefined) {
            this.createChart();
        }
    }

    

    createChart(data?: DataContainer[]) {
        console.log('creating digilent chart under id: ' + this.chartId);
        data = data == undefined ? [] : data;
        if (this.chartId == undefined || this.flotOptions == undefined) {
            setTimeout(() => {
                this.createChart();
            }, 200);
            return;
        }
        this.digilentChart = $.plot("#" + this.chartId, data, this.flotOptions);
        this.setNearestPresetSecPerDivVal();
        if (this.initialChartLoad) {
            this.initialChartLoad = false;
            this.chartLoad.emit();
        }
    }

    setData(dataToDraw: DataContainer[], autoscale?: boolean) {
        if (autoscale) {
            this.createChart(dataToDraw);
            return;
        }
        this.digilentChart.setData(dataToDraw);
        this.digilentChart.setupGrid();
        this.digilentChart.draw();
        this.setNearestPresetSecPerDivVal();
    }

    refreshChart(dataToDraw?: DataContainer[]) {
        this.createChart(dataToDraw);
        this.setNearestPresetSecPerDivVal();
    }

    setNearestPresetSecPerDivVal() {
        let getAxes = this.digilentChart.getAxes();
        let newSecPerDivVal = (getAxes.xaxis.max - getAxes.xaxis.min) / 10;
        let secsPerDivArray = this.digilentChart.getSecsPerDivArray();
        let count = 0;
        while (secsPerDivArray[count] < newSecPerDivVal && count < secsPerDivArray.length) {
            count++;
        }
        this.digilentChart.setActiveXIndex(count);
    }
}
