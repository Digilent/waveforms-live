import { Injectable } from '@angular/core';

//Components
import { DigilentChart, Chart, DataContainer } from 'digilent-chart-angular2/modules';

@Injectable()
export class LoggerPlotService {
    private digilentChart: DigilentChart;
    private chart: Chart;

    private xAxis: AxisInfo = {
        position: 0,
        base: 0.1
    };
    private yAxis: AxisInfo[] = [{
        position: 0,
        base: 0.5
    }];

    constructor() {

    }

    init(chartRef: DigilentChart) {
        this.digilentChart = chartRef;
        this.chart = this.digilentChart.digilentChart;
    }

    setData(data: DataContainer[], autoscale?: boolean) {
        this.digilentChart.setData(data, autoscale);
    }

    setMinMaxAndUpdate(axis: Axis, axisNum: number, min: number, max: number) {
        if (this.isInvalidAxisInfo(axis, axisNum)) { console.log('invalid axis num'); return; }
        let getAxes = this.chart.getAxes();
        let axisIndexer = this.getAxisIndexer(axis, axisNum);
        getAxes[axisIndexer].options.min = min;
        getAxes[axisIndexer].options.max = max;

        if (axis === 'x') {
            this.xAxis.position = (max + min) / 2;
        }
        else {
            this.yAxis[axisNum - 1].position = (max + min) / 2;
        }

        this.chart.setupGrid();
        this.chart.draw();
    }

    setValPerDivAndUpdate(axis: Axis, axisNum: number, valPerDiv: number) {
        if (this.isInvalidAxisInfo(axis, axisNum)) { console.log('invalid axis num'); return; }
        let getAxes = this.chart.getAxes();
        let axisIndexer = this.getAxisIndexer(axis, axisNum);
        let axisObj: AxisInfo;
        if (axis === 'x') {
            axisObj = this.xAxis;
        }
        else {
            axisObj = this.yAxis[axisNum - 1];
        }
        let max = valPerDiv * 5 + axisObj.position;
        let min = axisObj.position - valPerDiv * 5;
        getAxes[axisIndexer].options.min = min;
        getAxes[axisIndexer].options.max = max;

        axisObj.base = valPerDiv;
    }

    private getAxisIndexer(axis: Axis, axisNum: number): string {
        return axis + ((axisNum < 2) ? '' : axisNum.toString()) + 'axis';
    }

    private isInvalidAxisInfo(axis: Axis, axisNum: number): boolean {
        if (axisNum < 1) { return true; }
        if (axis === 'y' && this.yAxis[axisNum] == undefined) { return true; }
        return false;
    }
}

export interface AxisInfo {
    position: number,
    base: number
}

export type Axis = 'x' | 'y';