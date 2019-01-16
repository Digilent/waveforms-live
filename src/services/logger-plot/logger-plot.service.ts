import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

//Components
import { DigilentChart, Chart, DataContainer } from 'digilent-chart-angular2/modules';

declare var $: any;
declare function largestTriangleThreeBuckets(data: number[][], threshold: number, xAccessor: number, yAccessor: number): number[][];

@Injectable()
export class LoggerPlotService {
    private digilentChart: DigilentChart;
    private timelineChartRef: DigilentChart;
    public chart: Chart;
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
    public offsetChange: Subject<any>;
    public cursorType: CursorType = 'disabled';
    public cursorPositions: Array<CursorPositions> = [{ x: null, y: null }, { x: null, y: null }];
    public activeSeries: number = 1;
    public dataContainers: PlotDataContainer[] = [];
    public overSeriesAnchor: { over: boolean, seriesNum: number } = { over: false, seriesNum: null };
    private seriesAnchorVertPanRef: any;
    private seriesAnchorTouchVertPanRef: any;
    private seriesAnchorTouchStartRef: any;
    private unbindCustomEventsRef: any;
    private previousYPos = 0;

    constructor() {
        this.chartPan = new Subject();
        this.offsetChange = new Subject();
        this.seriesAnchorVertPanRef = this.seriesAnchorVertPan.bind(this);
        this.unbindCustomEventsRef = this.unbindCustomEvents.bind(this);
        this.seriesAnchorTouchStartRef = this.seriesAnchorTouchStart.bind(this);
        this.seriesAnchorTouchVertPanRef = this.seriesAnchorTouchVertPan.bind(this);
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
        let getAxes = this.chart.getAxes();

        getAxes.xaxis.options.show = true;

        this.redrawChart();
        this.attachListeners();

        this.chart.hooks.drawOverlay.push(this.updateSeriesAnchors.bind(this));
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

    setData(data: PlotDataContainer[], viewMoved: boolean) {
        // deep copy
        this.dataContainers = data.map(a => ({ ...a }));
        let timelineData = data.map(a => ({ ...a }));

        this.trimChartData(!viewMoved)
            .then(() => {
                this.shouldShowIndividualPoints(true);
            })
            .catch((err) => {
                console.log(err);
            });
        
        for (let i = 0; i < timelineData.length; i++) {
            timelineData[i].yaxis = 1;
            timelineData[i].data = largestTriangleThreeBuckets(timelineData[i].data, 1000, 0, 1);
        }

        if (this.timelineChartRef != undefined) {
            this.timelineChartRef.setData(timelineData, false);
            this.updateTimelineCurtains();
        }
    }

    trimChartData(snappedToFront: boolean = false) {
        return new Promise((resolve, reject) => {
            let chartData = this.dataContainers.map(a => ({ ...a })); // deep copy
            let xaxis = this.chart.getAxes().xaxis;

            // trim data to visible section of xaxis and draw
            for (let i = 0; i < chartData.length; i++) {
                let diff = 0;
                if (snappedToFront && chartData[i].data.length > 0) {
                    diff = chartData[i].data[chartData[i].data.length - 1][0] - xaxis.max;
                }

                let lastIndex = chartData[i].data.length - 1;
                chartData[i].data = chartData[i].data.filter((point, index) => {
                    let t0 = index === lastIndex ? point[0] : chartData[i].data[index + 1][0];
                    let t1 = index === 0 ? point[0] : chartData[i].data[index - 1][0];

                    return t0 >= (xaxis.min + diff) && t1 <= (xaxis.max + diff);
                });
                chartData[i].data = largestTriangleThreeBuckets(chartData[i].data, 1000, 0, 1);
            }

            this.chart.setData(chartData);
            this.chart.setupGrid();
            this.chart.draw();
            resolve();
        });
    }

    setViewToFront() {
        this.chart.setupGrid();
        if (this.timelineChartRef != undefined) {
            this.updateTimelineCurtains();
        }
        setTimeout(() => {
            this.trimChartData(true)
                .then(() => {
                    this.shouldShowIndividualPoints(false);
                    this.chart.draw();
                })
                .catch((err) => {
                    console.log(err);
                });
        }, 1);
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

            if (series[0].data.length < 2) {
                shouldRedraw = true;

                series[i].points.show = true;

                continue;
            }

            let dt;
            try {
               dt = (series[i].data[1][0] - series[i].data[0][0]);
            } catch(e) {
                continue;
            }
            
            let numPointsInView = (axesInfo.xaxis.max - axesInfo.xaxis.min) / dt;
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
        this.setNearestPerDivVal(axis, axisNum);

        if (redraw) {
            this.chart.setupGrid();
            if (this.timelineChartRef != undefined) {
                this.updateTimelineCurtains();
            }
            setTimeout(() => {
                this.trimChartData(false)
                    .then(() => {
                        this.shouldShowIndividualPoints(false);
                        this.chart.draw();
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }, 1);
        }
    }

    private setNearestPerDivVal(axis: Axis, axisNum: number) {
        let count = 0;
        if (axis === 'x') {
            while (this.tpdArray[count] < this.xAxis.base && count < this.tpdArray.length) {
                count++;
            }
            this.tpdIndex = count;
            this.chart.setActiveXIndex(this.tpdIndex);
        }
        else {
            while (this.vpdArray[count] < this.yAxis[axisNum - 1].base && count < this.vpdArray.length) { 
                count++;
            }
            this.vpdIndices[axisNum - 1] = count;
            this.chart.setActiveYIndices(this.vpdIndices);
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
                this.trimChartData(false)
                    .then(() => {
                        this.shouldShowIndividualPoints(true);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }, 1);
        });

        $("#loggerTimeline").bind("timelinePanEvent", (event, data) => {
            this.xAxis.position = data.mid;
            this.chartPan.next(data);
            setTimeout(() => {
                this.trimChartData(false)
                    .then(() => {
                        this.shouldShowIndividualPoints(true);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }, 1);
        });

        $("#loggerTimeline").bind("click", (event) => {
            this.trimChartData(false)
                .then(() => {
                    this.shouldShowIndividualPoints(true);
                })
                .catch((err) => {
                    console.log(err);
                });
        });
    }

    private attachListeners() {
        $("#loggerChart").bind("panEvent", (event, panData) => {
            if (panData.axis === 'xaxis') {
                this.chartPan.next(panData);
                this.xAxis.position = panData.mid;
                setTimeout(() => {
                    this.trimChartData(false)
                        .then(() => {
                            this.shouldShowIndividualPoints(true);
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                }, 1);
            }
            else {
                this.yAxis[panData.axisNum - 1].position = panData.mid;
                this.offsetChange.next({axisNum: panData.axisNum - 1, offset: panData.mid});
            }
            this.refreshCursors();
        });

        $("#loggerChart").bind("mouseWheelRedraw", (event, wheelData) => {
            if (wheelData.axis === 'xaxis') {
                this.tpdIndex = wheelData.perDivArrayIndex;
                this.xAxis.base = this.tpdArray[this.tpdIndex];
                this.xAxis.position = wheelData.mid;
                setTimeout(() => {
                    this.trimChartData(false)
                        .then(() => {
                            this.shouldShowIndividualPoints(true);
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                }, 1);
            }
            else {
                this.vpdIndices[wheelData.axisNum - 1] = wheelData.perDivArrayIndex;
                this.vpdArray[wheelData.axisNum - 1] = this.vpdArray[this.vpdIndices[wheelData.axisNum - 1]];
            }
            this.refreshCursors();
        });

        $("#loggerChart").bind("cursorupdates", (event, cursorData) => {
            if (cursorData[0] == undefined) { return; }
            for (let i = 0; i < cursorData.length; i++) {
                if (cursorData[i].cursor !== 'triggerLine') {
                    let cursorNum = parseInt(cursorData[i].cursor.slice(-1)) - 1;
                    this.cursorPositions[cursorNum].x = cursorData[i].x;
                    this.cursorPositions[cursorNum].y = cursorData[i].y;
                }
            }
        });

        $("#loggerChart").bind("mousemove", (event) => {
            if (this.dataContainers == undefined) { return; }
            let offsets = this.chart.offset();
            let plotRelXPos = event.clientX - offsets.left;
            let plotRelYPos = event.clientY - offsets.top;
            let getAxes = this.chart.getAxes();

            for (let i = 0; i < this.dataContainers.length; i++) {
                if (this.dataContainers[i].data.length < 1) { continue; }
                let yIndexer = 'y' + (i === 0 ? '' : (i + 1).toString()) + 'axis';
                let seriesAnchorPixPos = getAxes[yIndexer].p2c(this.dataContainers[i].seriesOffset);
                if (plotRelXPos > -20 && plotRelXPos < 5 && plotRelYPos < seriesAnchorPixPos + 10 && plotRelYPos > seriesAnchorPixPos - 10) {
                    this.overSeriesAnchor = {
                        over: true,
                        seriesNum: i
                    }
                    this.chart.getPlaceholder().css('cursor', 'ns-resize');
                    return;
                }
            }
            if (this.overSeriesAnchor.over) {
                this.overSeriesAnchor = {
                    over: false,
                    seriesNum: null
                }
                this.chart.getPlaceholder().css('cursor', 'default');
            }
        });

        $("#loggerChart").bind("mousedown", (event) => {
            if (this.overSeriesAnchor.over) {
                this.chart.unbindMoveEvents();
                this.setActiveSeries(this.overSeriesAnchor.seriesNum + 1);
                this.chart.triggerRedrawOverlay();
                $("#loggerChart").bind("mousemove", this.seriesAnchorVertPanRef);
                $("#loggerChart").bind("mouseup", this.unbindCustomEventsRef);
                $("#loggerChart").bind("mouseout", this.unbindCustomEventsRef);
                this.previousYPos = event.clientY;
                return;
            }
        });
    }

    refreshCursors() {
        let cursors = this.chart.getCursors();
        let cursorsToUpdate = [];
        let newOptions = [];
        for (let i = 0; i < cursors.length; i++) {
            if (cursors[i].mode === 'y') { return; }
            if (cursors[i].name !== 'triggerLine') {
                cursorsToUpdate.push(cursors[i]);
                let cursorNum = parseInt(cursors[i].name.slice(-1)) - 1;
                newOptions.push({
                    position: {
                        x: this.cursorPositions[cursorNum].x || 0,
                        y: this.cursorPositions[cursorNum].y || 0
                    }
                });
            }
        }

        this.chart.setMultipleCursors(cursorsToUpdate, newOptions);
    }

    unbindCustomEvents(e) {
        $("#loggerChart").unbind("mousemove", this.seriesAnchorVertPanRef);
        $("#loggerChart").unbind("touchmove", this.seriesAnchorTouchVertPanRef);
        $("#loggerChart").unbind("mouseup", this.unbindCustomEventsRef);
        $("#loggerChart").unbind("mouseout", this.unbindCustomEventsRef);
        this.chart.getPlaceholder().css('cursor', 'default');
    }

    seriesAnchorVertPan(e) {
        let yIndexer = 'y' + ((this.activeSeries - 1 === 0) ? '' : this.activeSeries.toString()) + 'axis';
        let getAxes = this.chart.getAxes();
        let newVal = getAxes[yIndexer].c2p(e.clientY);
        let oldValinNewWindow = getAxes[yIndexer].c2p(this.previousYPos);
        let difference = newVal - oldValinNewWindow;
        let base = (getAxes[yIndexer].max + getAxes[yIndexer].min) / 2;
        let voltsPerDivision = (getAxes[yIndexer].max - getAxes[yIndexer].min) / 10;
        let newPos = base - difference;
        let min = newPos - voltsPerDivision * 5;
        let max = newPos + voltsPerDivision * 5;
        getAxes[yIndexer].options.min = min;
        getAxes[yIndexer].options.max = max;
        this.chart.setupGrid();
        this.chart.draw();
        this.yAxis[this.activeSeries - 1].position = base;
        this.offsetChange.next({axisNum: this.activeSeries - 1, offset: base});
        this.previousYPos = e.clientY;
    }

    seriesAnchorTouchVertPan(e) {
        let yIndexer = 'y' + ((this.activeSeries - 1 === 0) ? '' : this.activeSeries.toString()) + 'axis';
        let getAxes = this.chart.getAxes();
        let newVal = getAxes[yIndexer].c2p(e.originalEvent.touches[0].clientY);
        let oldValinNewWindow = getAxes[yIndexer].c2p(this.previousYPos);
        let difference = newVal - oldValinNewWindow;
        let base = (getAxes[yIndexer].max + getAxes[yIndexer].min) / 2;
        let voltsPerDivision = (getAxes[yIndexer].max - getAxes[yIndexer].min) / 10;
        let newPos = base - difference;
        let min = newPos - voltsPerDivision * 5;
        let max = newPos + voltsPerDivision * 5;
        getAxes[yIndexer].options.min = min;
        getAxes[yIndexer].options.max = max;
        this.chart.setupGrid();
        this.chart.draw();
        this.yAxis[this.activeSeries - 1].position = base;
        this.offsetChange.next({axisNum: this.activeSeries - 1, offset: base});
        this.previousYPos = e.originalEvent.touches[0].clientY;
    }

    seriesAnchorTouchStart(event) {
        if (this.dataContainers == undefined) { return; }
        let offsets = this.chart.offset();
        let plotRelXPos = event.originalEvent.touches[0].clientX - offsets.left;
        let plotRelYPos = event.originalEvent.touches[0].clientY - offsets.top;
        let getAxes = this.chart.getAxes();
        for (let i = 0; i < this.dataContainers.length; i++) {
            if (this.dataContainers[i].data.length < 1) { return; }
            let yIndexer = 'y' + (i === 0 ? '' : (i + 1).toString()) + 'axis';
            let seriesAnchorPixPos = getAxes[yIndexer].p2c(this.dataContainers[i].seriesOffset);
            if (plotRelXPos > -20 && plotRelXPos < 5 && plotRelYPos < seriesAnchorPixPos + 10 && plotRelYPos > seriesAnchorPixPos - 10) {
                this.overSeriesAnchor = {
                    over: true,
                    seriesNum: i
                }
                this.chart.unbindMoveEvents();
                this.setActiveSeries(this.overSeriesAnchor.seriesNum + 1);
                this.chart.triggerRedrawOverlay();
                $("#loggerChart").bind("touchmove", this.seriesAnchorTouchVertPanRef);
                $("#loggerChart").bind("touchend", this.unbindCustomEventsRef);
                $("#loggerChart").bind("touchleave", this.unbindCustomEventsRef);
                this.previousYPos = event.originalEvent.touches[0].clientY;
                return;
            }
        }
        this.overSeriesAnchor = {
            over: false,
            seriesNum: null
        }
    }

    setActiveSeries(seriesNum: number) {
        this.updateYAxisLabels(seriesNum);
        this.chart.setActiveYAxis(seriesNum);
        this.activeSeries = seriesNum;
    }

    updateYAxisLabels(newActiveSeries: number) {
        //Check if length is > 1 because axes should still switch before data is added. Once data is added, make sure new active series is in range
        if ((this.dataContainers.length > 1 && newActiveSeries > this.dataContainers.length) || newActiveSeries === this.activeSeries) { return; }
        let axes = this.chart.getAxes();
        let yIndexer1 = 'y' + ((newActiveSeries - 1 === 0) ? '' : newActiveSeries.toString()) + 'axis';
        let yIndexer0 = 'y' + ((this.activeSeries - 1 === 0) ? '' : this.activeSeries.toString()) + 'axis';
        axes[yIndexer0].options.show = false;
        axes[yIndexer1].options.show = true;
        this.chart.setupGrid();
        this.chart.draw();
    }

    updateSeriesAnchors(plot: any, ctx: any) {
        if (this.dataContainers == undefined) { return; }

        let offsets = this.chart.offset();
        let getAxes = this.chart.getAxes();
        let series = this.chart.getData();

        for (let i = 0; i < this.dataContainers.length; i++) {
            if (this.dataContainers[i].data.length < 1 || series[i] == undefined) { continue; }

            let strokeColor = 'black';
            let lineWidth = 1;
            if (this.activeSeries - 1 === i) {
                strokeColor = 'white';
                lineWidth = 2;
            }
            
            let seriesNum = i;
            let yIndexer = 'y' + ((seriesNum === 0) ? '' : (seriesNum + 1).toString()) + 'axis';
            let offsetVal = this.dataContainers[seriesNum].seriesOffset;
            let offsetPix = getAxes[yIndexer].p2c(offsetVal);
            
            ctx.save();
            ctx.translate(offsets.left - 11, offsetPix + 10);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 10);
            ctx.lineTo(10, 5);
            ctx.closePath();
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
            ctx.fillStyle = series[i].color;
            ctx.fill();
            ctx.restore();
        }
    }
}

export interface AxisInfo {
    position: number,
    base: number
}

export type Axis = 'x' | 'y';

export type CursorType = 'disabled' | 'track' | 'time' | 'voltage';

export interface CursorPositions {
    x: number,
    y: number
}

export interface CursorInfo {
    instrument: 'Osc' | 'LA' | 'Log',
    channel: number,
    position: CursorPositions
}

export interface PlotDataContainer extends DataContainer {
    seriesOffset: number
}