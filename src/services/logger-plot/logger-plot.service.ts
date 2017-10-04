import { Injectable } from '@angular/core';

//Components
import { DigilentChart, Chart, DataContainer } from 'digilent-chart-angular2/modules';

declare var $: any;

@Injectable()
export class LoggerPlotService {
    private digilentChart: DigilentChart;
    private chart: Chart;
    public tpdArray: number[];
    public tpdIndex: number;
    public vpdArray: number[];
    public vpdIndices: number[];

    public xAxis: AxisInfo = {
        position: 0.5,
        base: 0.1
    };
    public yAxis: AxisInfo[] = [{
        position: 0,
        base: 0.5
    }];

    constructor() { }

    init(chartRef: DigilentChart) {
        this.digilentChart = chartRef;
        this.chart = this.digilentChart.digilentChart;
        this.tpdArray = this.chart.getSecsPerDivArray();
        this.tpdIndex = this.chart.getActiveXIndex();
        this.setValPerDivAndUpdate('x', 1, this.tpdArray[this.tpdIndex]);
        console.log(this.tpdArray);
        console.log(this.tpdIndex);
        this.attachListeners();
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
            this.xAxis.base = (max - min) / 10;
        }
        else {
            this.yAxis[axisNum - 1].position = (max + min) / 2;
            this.yAxis[axisNum - 1].base = (max - min) / 10;
        }

        this.chart.setupGrid();
        this.chart.draw();
    }

    setValPerDivAndUpdate(axis: Axis, axisNum: number, valPerDiv: number) {
        if (this.isInvalidAxisInfo(axis, axisNum)) { console.log('invalid axis num'); return; }
        let getAxes = this.chart.getAxes();
        let axisIndexer = this.getAxisIndexer(axis, axisNum);
        let axisObj: AxisInfo = axis === 'x' ? this.xAxis : this.yAxis[axisNum - 1];
        let max = valPerDiv * 5 + axisObj.position;
        let min = axisObj.position - valPerDiv * 5;
        getAxes[axisIndexer].options.min = min;
        getAxes[axisIndexer].options.max = max;

        axisObj.base = valPerDiv;
        console.log(this.xAxis.base);

        this.chart.setupGrid();
        this.chart.draw();
    }

    private getAxisIndexer(axis: Axis, axisNum: number): string {
        return axis + ((axisNum < 2) ? '' : axisNum.toString()) + 'axis';
    }

    private isInvalidAxisInfo(axis: Axis, axisNum: number): boolean {
        if (axisNum < 1) { return true; }
        if (axis === 'y' && this.yAxis[axisNum] == undefined) { return true; }
        return false;
    }

    attachListeners() {
        $("#loggerChart").bind("panEvent", (event, panData) => {
            if (panData.axis === 'xaxis') {
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
                /* setTimeout(() => {
                    this.shouldShowIndividualPoints();
                    this.refreshCursors();
                }, 20); */
            }
            else {
                /* this.activeVPDIndex[wheelData.axisNum - 1] = wheelData.perDivArrayIndex;
                this.voltDivision[wheelData.axisNum - 1] = this.voltsPerDivVals[this.activeVPDIndex[wheelData.axisNum - 1]]; */
            }
        });
    }

    /* $("#flotContainer").bind("panEvent", (event, panData) => {
        if (panData.axis === 'xaxis') {
            this.base = panData.mid;
            this.refreshCursors();
        }
        else {
            this.voltBase[panData.axisNum - 1] = panData.mid;
        }
    });
    $("#flotContainer").bind("cursorupdates", (event, cursorData) => {
        if (cursorData[0] === undefined || this.cursorType.toLowerCase() === 'disabled') { return; }
        for (let i = 0; i < cursorData.length; i++) {
            if (cursorData[i].cursor !== 'triggerLine') {
                let cursorNum = parseInt(cursorData[i].cursor.slice(-1)) - 1;
                this.cursorPositions[cursorNum].x = cursorData[i].x;
                this.cursorPositions[cursorNum].y = cursorData[i].y;
            }
        }
    });
    $("#flotContainer").bind("mouseWheelRedraw", (event, wheelData) => {
        if (wheelData.axis === 'xaxis') {
            this.activeTPDIndex = wheelData.perDivArrayIndex;
            this.timeDivision = this.secsPerDivVals[this.activeTPDIndex];
            this.base = wheelData.mid;
            setTimeout(() => {
                this.shouldShowIndividualPoints();
                this.refreshCursors();
            }, 20);
        }
        else {
            this.activeVPDIndex[wheelData.axisNum - 1] = wheelData.perDivArrayIndex;
            this.voltDivision[wheelData.axisNum - 1] = this.voltsPerDivVals[this.activeVPDIndex[wheelData.axisNum - 1]];
        }
    }); */
}

export interface AxisInfo {
    position: number,
    base: number
}

export type Axis = 'x' | 'y';