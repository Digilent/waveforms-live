import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

//Components
import { DigilentChart, Chart, DataContainer } from 'digilent-chart-angular2/modules';

declare var $: any;

@Injectable()
export class LoggerPlotService {
    private digilentChart: DigilentChart;
    private timelineChartRef: DigilentChart;
    private chart: Chart;
    public tpdArray: number[];
    public tpdIndex: number;
    public vpdArray: number[];
    public vpdIndices: number[];

    public xAxis: AxisInfo = {
        position: 0.5,
        base: 0.1
    };
    public yAxis: AxisInfo[] = [];
    public chartPan: Subject<any>;

    constructor() {
        this.chartPan = new Subject();
    }

    //Reset the service when the logger page is destroyed so old values aren't used. This service is not destructed
    resetService() {
        this.digilentChart = undefined;
        this.timelineChartRef = undefined;
        this.chart = undefined;
        this.tpdArray = undefined;
        this.tpdIndex = undefined;
        this.vpdArray = undefined;
        this.vpdIndices = undefined;
        this.xAxis = {
            position: 0.5,
            base: 0.1
        };
        this.yAxis = [];
    }

    init(chartRef: DigilentChart) {
        this.digilentChart = chartRef;
        this.chart = this.digilentChart.digilentChart;
        this.tpdArray = this.chart.getSecsPerDivArray();
        this.tpdIndex = this.chart.getActiveXIndex();
        this.vpdArray = this.chart.getVoltsPerDivArray();
        this.vpdIndices = this.chart.getActiveYIndices();
        this.setValPerDivAndUpdate('x', 1, this.tpdArray[this.tpdIndex], false);
        for (let i = 0; i < this.vpdIndices.length; i++) {
            this.yAxis.push({
                position: 0,
                base: 0.5
            });
            this.setValPerDivAndUpdate('y', i + 1, this.vpdArray[this.vpdIndices[i]], false);
        }
        console.log(this.vpdArray);
        this.redrawChart();
        this.attachListeners();
    }

    setTimelineRef(chartRef: DigilentChart) {
        if (this.chart == undefined) {
            setTimeout(() => {
                this.setTimelineRef(chartRef);
            }, 1);
            return;
        }
        this.timelineChartRef = chartRef;
        this.timelineChartRef.digilentChart.setSecsPerDivArray(this.tpdArray);
        this.timelineChartRef.digilentChart.setActiveXIndex(this.tpdIndex);
        (<any>this.timelineChartRef.digilentChart).setExistingChartRef(this.chart);
        (<any>this.timelineChartRef.digilentChart).updateExistingChart();
        this.chart.setTimelineRef(this.timelineChartRef.digilentChart);
        this.chart.setTimelineUpdate(true);
        this.attachTimelineListeners();
    }

    setData(data: DataContainer[], autoscale?: boolean) {
        this.digilentChart.setData(data, autoscale);
        if (this.timelineChartRef != undefined) {
            let tempYaxisNums: number[] = [];
            for (let i = 0; i < data.length; i++) {
                tempYaxisNums.push(data[i].yaxis);
                data[i].yaxis = 1;
            }
            this.timelineChartRef.setData(data, false);
            for (let i = 0; i < data.length; i++) {
                data[i].yaxis = tempYaxisNums[i];
            }
            this.updateTimelineCurtains();
        }
        this.shouldShowIndividualPoints(true);
    }

    redrawChart() {
        this.chart.setupGrid();
        this.shouldShowIndividualPoints(false);
        this.chart.draw();
        if (this.timelineChartRef != undefined) {
            this.updateTimelineCurtains();
        }
    }

    updateTimelineCurtains(minMax?: { min: number, max: number }) {
        if (minMax != undefined) {
            this.timelineChartRef.digilentChart.updateTimelineCurtains(minMax);
            return;
        }
        let getAxes = this.chart.getAxes();
        this.timelineChartRef.digilentChart.updateTimelineCurtains({
            min: getAxes.xaxis.min,
            max: getAxes.xaxis.max
        });
    }

    shouldShowIndividualPoints(redraw?: boolean) {
        redraw = redraw == undefined ? false : redraw;
        let series = this.chart.getData();
        let axesInfo = this.chart.getAxes();
        let shouldRedraw = false;
        for (let i = 0; i < series.length; i++) {
            if (series[0].data.length < 1) { return; }
            let numPointsInView = (axesInfo.xaxis.max - axesInfo.xaxis.min) / (series[i].data[1][0] - series[i].data[0][0]);
            let currentVal = series[i].points.show;
            let shouldShowPoints = numPointsInView < 50;
            series[i].points.show = shouldShowPoints;
            if (currentVal !== shouldShowPoints) {
                shouldRedraw = true;
            }
        }
        if (shouldRedraw && redraw) {
            this.chart.draw();
        }
    }

    setMinMaxAndUpdate(axis: Axis, axisNum: number, min: number, max: number, redraw?: boolean) {
        if (this.isInvalidAxisInfo(axis, axisNum)) { console.log('invalid axis num'); return; }
        redraw = redraw == undefined ? true : redraw;
        let getAxes = this.chart.getAxes();
        let axisIndexer = this.getAxisIndexer(axis, axisNum);
        getAxes[axisIndexer].options.min = min;
        getAxes[axisIndexer].options.max = max;

        if (axis === 'x') {
            this.xAxis.position = (max + min) / 2;
            this.xAxis.base = (max - min) / 10;
        }
        else {
            this.yAxis[axisNum - 1].position = (max + min) / 2;
            this.yAxis[axisNum - 1].base = (max - min) / 10;
        }

        if (redraw) {
            this.redrawChart();
        }
    }

    setValPerDivAndUpdate(axis: Axis, axisNum: number, valPerDiv: number, redraw?: boolean) {
        if (this.isInvalidAxisInfo(axis, axisNum)) { console.log('invalid axis num'); return; }
        redraw = redraw == undefined ? true : redraw;
        let getAxes = this.chart.getAxes();
        let axisIndexer = this.getAxisIndexer(axis, axisNum);
        let axisObj: AxisInfo = axis === 'x' ? this.xAxis : this.yAxis[axisNum - 1];
        let max = valPerDiv * 5 + axisObj.position;
        let min = axisObj.position - valPerDiv * 5;
        getAxes[axisIndexer].options.min = min;
        getAxes[axisIndexer].options.max = max;

        axisObj.base = valPerDiv;
        console.log(this.xAxis.base);

        if (redraw) {
            this.redrawChart();
        }
    }

    setPosition(axis: Axis, axisNum: number, position: number, redraw?: boolean) {
        if (this.isInvalidAxisInfo(axis, axisNum)) { console.log('invalid axis num'); return; }
        redraw = redraw == undefined ? true : redraw;
        let getAxes = this.chart.getAxes();
        let axisIndexer = this.getAxisIndexer(axis, axisNum);
        let axisObj: AxisInfo = axis === 'x' ? this.xAxis : this.yAxis[axisNum - 1];
        let max = axisObj.base * 5 + position;
        let min = position - axisObj.base * 5;
        getAxes[axisIndexer].options.min = min;
        getAxes[axisIndexer].options.max = max;

        axisObj.position = position;

        if (redraw) {
            this.redrawChart();
        }
    }

    private getAxisIndexer(axis: Axis, axisNum: number): string {
        return axis + ((axisNum < 2) ? '' : axisNum.toString()) + 'axis';
    }

    private isInvalidAxisInfo(axis: Axis, axisNum: number): boolean {
        if (axisNum < 1) { return true; }
        if (axis === 'y' && this.yAxis[axisNum - 1] == undefined) { return true; }
        return false;
    }

    private attachTimelineListeners() {
        $("#loggerTimeline").bind("timelineWheelRedraw", (event, wheelData) => {
            this.tpdIndex = wheelData.perDivArrayIndex;
            this.xAxis.base = this.tpdArray[this.tpdIndex];
            this.xAxis.position = wheelData.mid;
            setTimeout(() => {
                this.shouldShowIndividualPoints(true);
            }, 1);
        });

        $("#loggerTimeline").bind("timelinePanEvent", (event, data) => {
            this.xAxis.position = data.mid;
            this.chartPan.next(data);
        });
    }

    private attachListeners() {
        $("#loggerChart").bind("panEvent", (event, panData) => {
            if (panData.axis === 'xaxis') {
                this.chartPan.next(panData);
                this.xAxis.position = panData.mid;
            }
            else {
                this.yAxis[panData.axisNum - 1].position = panData.mid;
            }
        });

        $("#loggerChart").bind("mouseWheelRedraw", (event, wheelData) => {
            if (wheelData.axis === 'xaxis') {
                this.tpdIndex = wheelData.perDivArrayIndex;
                this.xAxis.base = this.tpdArray[this.tpdIndex];
                this.xAxis.position = wheelData.mid;
                setTimeout(() => {
                    this.shouldShowIndividualPoints(true);
                }, 1);
            }
            else {
                this.vpdIndices[wheelData.axisNum - 1] = wheelData.perDivArrayIndex;
                this.vpdArray[wheelData.axisNum - 1] = this.vpdArray[this.vpdIndices[wheelData.axisNum - 1]];
            }
        });
    }
}

export interface AxisInfo {
    position: number,
    base: number
}

export type Axis = 'x' | 'y';