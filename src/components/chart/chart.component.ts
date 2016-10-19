import { Component, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { ModalController } from 'ionic-angular';

//Components
import { TimelineChartComponent } from '../timeline-chart/timeline-chart.component';
import { DeviceComponent } from '../device/device.component';
import { WaveformComponent } from '../data-types/waveform';

//Pages
import { ModalCursorPage } from '../../pages/cursor-modal/cursor-modal';
import { MathModalPage } from '../../pages/math-modal/math-modal';
import { ChartModalPage } from '../../pages/chart-modal/chart-modal';

//Interfaces
import { Chart, ChartBounds, CursorPositions } from './chart.interface';

@Component({
    selector: 'silverNeedleChart',
    templateUrl: 'chart.html'
})

export class SilverNeedleChart {
    @Output() chartLoad: EventEmitter<any> = new EventEmitter();
    @ViewChild('oscopeChartInner') oscopeChartInner: ElementRef;
    public timelineChartInner: ElementRef;
    public chart: Chart;
    public timelineChartComponent: TimelineChartComponent;
    public timelineChart: Chart = null;
    public options: Object;
    public xPosition: number = 0;
    public xPositionPixels: number = 0;
    public yPositionPixels: number = 0;
    public yPosition: number = 0;
    public numXCursors: number = 0;
    //public cursorLabel: any[];
    public cursorAnchors: any[] = [0, 0, 0, 0];
    public xCursorDragStartPos: any;
    public activeCursor: number = -1;
    public activeSeries: number = 1;
    public numYCursors: number = 0;
    public cursorType: string = 'disabled';
    public cursor1Chan: string = 'Osc 1';
    public cursor2Chan: string = 'Osc 1';
    public cursorsEnabled: boolean = false;
    public cursorRefs: any[] = [];
    public timelineCursorRefs: any[] = [];
    public canPan: boolean = false;
    public activeTimeLine: number = -1;
    public chartBoundsX: ChartBounds = null;
    public chartBoundsY: ChartBounds = null;
    public inTimelineDrag: boolean = false;
    public activeChannels = [1, 1];
    public mathEnabled: boolean = false;
    public generalVoltsPerDivOpts: string[] = ['1 mV', '2 mV', '5 mv', '10 mV', '20 mV', '50 mV', '100 mV', '200 mV', '500 mV', '1 V', '2 V', '5 V'];
    public activeVPDIndex: number[] = [9, 9];
    public generalVoltsPerDivVals: number[] = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5];
    public voltsPerDivOpts: string[] = this.generalVoltsPerDivOpts;
    public voltsPerDivVals: number[] = this.generalVoltsPerDivVals;

    public secsPerDivOpts: string[] = ['1 ns', '2 ns', '5 ns', '10 ns', '20 ns', '50 ns', '100 ns', '200 ns', '500 ns', '1 us',
        '2 us', '5 us', '10 us', '20 us', '50 us', '100 us', '200 us', '500 us', '1 ms', '2 ms', '5 ms', '10 ms', '20 ms',
        '50 ms', '100 ms', '200 ms', '500 ms', '1 s', '2 s', '5 s', '10 s'];
    public activeTPDIndex: number = 27;
    public secsPerDivVals: number[] = [0.000000001, 0.000000002, 0.000000005, 0.00000001, 0.00000002, 0.00000005, 0.0000001, 0.0000002,
        0.0000005, 0.000001, 0.000002, 0.000005, 0.00001, 0.00002, 0.00005, 0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01,
        0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];

    public timelineView: boolean = false;
    public timelineBounds: number[] = [0, 0, 0, 0];

    public timeDivision: number = 1;
    public base: number = 0;
    public numSeries: number[] = [0];

    public voltDivision: number[] = [1, 1];
    public voltBase: number[] = [0, 0];

    public cursorPositions: Array<CursorPositions> = [{ x: null, y: null }, { x: null, y: null }];
    public modalCtrl: ModalController;

    public chartReady: boolean = false;
    public timelineChartReady: boolean = false;
    public timelineChartInitialized: boolean = false;

    public timelineChartEventListener: EventEmitter<any>;

    public currentBufferArray: WaveformComponent[] = [];

    public seriesAnchors: Array<any> = [];

    public oscopeChansActive: boolean[] = [];

    public colorArray: string[] = ['#7cb5ec', '#fffe00', 'ff3b99', '00c864'];
    public triggerPlotLine: any;
    public timelineTriggerPlotLine: any;
    public triggerAnchor: any;
    public deviceDescriptor: DeviceComponent;

    public selectedMathInfo: any = [];

    constructor(_modalCtrl: ModalController) {
        this.modalCtrl = _modalCtrl;

        this.options = {
            chart: {
                type: 'line',
                zoomType: '',
                animation: false,
                spacingTop: 20,
                backgroundColor: 'black'
            },
            colors: this.colorArray,
            title: {
                text: '',
                style: {
                    color: '#666666'
                }
            },
            tooltip: {
                enabled: true,
                formatter: function () {
                    let timePerDiv = Math.abs(this.series.xAxis.max - this.series.xAxis.min) / 10;
                    if (parseFloat(this.value) == 0) {
                        return 0 + 's';
                    }
                    let i = 0;
                    let unit = '';
                    while (timePerDiv < 1) {
                        i++;
                        timePerDiv = timePerDiv * 1000;
                    }
                    this.x = (parseFloat(this.x) * Math.pow(1000, i)).toFixed(0);
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
                    this.x = this.x + unit;
                    let vPerDiv = Math.abs(this.series.yAxis.max - this.series.yAxis.min) / 10;
                    i = 0;
                    while (vPerDiv < 1) {
                        i++;
                        vPerDiv = vPerDiv * 1000;
                    }
                    this.y = (parseFloat(this.y) * Math.pow(1000, i)).toFixed(0);
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
                    this.y = this.y + unit;
                    return '<b>' + this.x + '</b> <b> ('
                        + this.y + ')</b>';
                }
            },
            legend: {
                enabled: false
            },
            series: [{
                data: []
            }],
            yAxis: [{
                gridLineWidth: 1,
                gridLineColor: '#666666',
                offset: 0,
                labels: {
                    style: {
                        color: '#666666'
                    },
                    formatter: function () {
                        let vPerDiv = Math.abs(this.chart.yAxis[0].max - this.chart.yAxis[0].min) / 10;
                        let i = 0;
                        let unit = '';
                        while (vPerDiv < 1) {
                            i++;
                            vPerDiv = vPerDiv * 1000;
                        }
                        this.value = (parseFloat(this.value) * Math.pow(1000, i)).toFixed(0);
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
                        return this.value + unit;
                    }
                },
                tickPositioner: function () {
                    let numTicks = 11;
                    let ticks = [];
                    let min = this.chart.yAxis[0].min;
                    let max = this.chart.yAxis[0].max;
                    let delta = (max - min) / (numTicks - 1);
                    for (var i = 0; i < numTicks; i++) {
                        ticks[i] = (min + i * delta);
                    }
                    return ticks;
                },
                title: {
                    text: 'Osc 1',
                    style: {
                        color: '#666666'
                    },
                }
            }],
            plotOptions: {
                series: {
                    pointInterval: 2,
                    pointStart: 0,
                    stickyTracking: false
                }
            },
            credits: {
                enabled: false
            },
            xAxis: {
                minRange: 0.000000001,
                labels: {
                    style: {
                        color: '#666666'
                    },
                    formatter: function () {
                        let timePerDiv = Math.abs(this.chart.xAxis[0].max - this.chart.xAxis[0].min) / 10;
                        if (parseFloat(this.value) == 0) {
                            return 0 + ' s';
                        }
                        let i = 0;
                        let unit = '';
                        while (timePerDiv < 1) {
                            i++;
                            timePerDiv = timePerDiv * 1000;
                        }
                        this.value = (parseFloat(this.value) * Math.pow(1000, i)).toFixed(0);
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
                        return this.value + unit;
                    }
                },
                lineColor: '#666666',
                startOnTick: true,
                endOnTick: true,
                tickColor: '#666666',
                minorTickColor: '#666666',
                gridLineWidth: 1,
                gridLineColor: '#666666',
                minorGridLineWidth: 0,

                tickPositioner: function () {
                    let numTicks = 11;
                    let ticks = [];
                    let min = this.chart.xAxis[0].min;
                    let max = this.chart.xAxis[0].max;
                    let delta = (max - min) / (numTicks - 1);
                    for (var i = 0; i < numTicks; i++) {
                        ticks[i] = (min + i * delta);
                    }
                    return ticks;
                },

                minorTickInterval: 'auto',
                minorTickLength: 10,
                minorTickWidth: 1,
                minorTickPosition: 'inside',

            }
        };
    }

    scrollEvent(event) {
        if (event.deltaY > 0) {
            this.incrementTPD(0);
        }
        else if (event.deltaY < 0) {
            this.decrementTPD(0);
        }
    }

    loadDeviceSpecificValues(deviceComponent: DeviceComponent) {
        this.deviceDescriptor = deviceComponent;
        let resolution = (deviceComponent.instruments.osc.chans[0].adcVpp / 1000) / Math.pow(2, deviceComponent.instruments.osc.chans[0].effectiveBits);
        let i = 0;
        while (resolution > this.generalVoltsPerDivVals[i] && i < this.generalVoltsPerDivVals.length - 1) {
            i++;
        }
        this.voltsPerDivVals = this.generalVoltsPerDivVals.slice(i);
        this.voltsPerDivOpts = this.generalVoltsPerDivOpts.slice(i);

        for (let i = 0; i < deviceComponent.instruments.osc.numChans; i++) {
            //Set the first oscope to on
            this.oscopeChansActive.push(i === 0);
        }

    }

    ngOnDestroy() {
        if (this.timelineView) {
            this.timelineChartEventListener.unsubscribe();
        }
    }

    //Called once on chart load
    onLoad(chartInstance) {
        //Save a reference to the chart object so we can call methods on it later
        this.chart = chartInstance;

        //Redraw chart to scale chart to container size
        this.chartReady = true;
        if (this.timelineChartReady === true && this.timelineChartInitialized === false) {
            this.timelineChartInit();
            this.chartLoad.emit(this.chart);
        }
        else if (this.timelineView === false) {
            this.chartLoad.emit(this.chart);
        }

        if (this.deviceDescriptor !== undefined) {
            document.getElementById('chart-component-container').addEventListener("wheel", this.scrollEvent.bind(this));
            this.chart.renderer.image('assets/img/settingsButton.png', 5, 5, 27, 25).attr({
                id: ('settingsButton')
            })
                .css({
                    'cursor': 'pointer'
                })
                .add()
                .on('click', (event) => {
                    let modal = this.modalCtrl.create(ChartModalPage, {
                        chartComponent: this
                    });
                    modal.present();
                });


            //Load all axes for all possible series (osc and la). No noticeable performance hits
            for (let i = 0; i < this.deviceDescriptor.instruments.la.numChans + this.deviceDescriptor.instruments.osc.numChans - 1; i++) {
                this.addYAxis(i);
                this.addSeries(i);
            }

            //Init axes settings
            for (let i = 0; i < this.deviceDescriptor.instruments.osc.numChans; i++) {
                this.activeVPDIndex[i] = this.voltsPerDivVals.indexOf(0.5);
                this.setSeriesSettings({
                    voltsPerDiv: this.voltsPerDivVals[this.activeVPDIndex[i]],
                    voltBase: this.voltBase[i],
                    seriesNum: i
                });
            }

            this.activeTPDIndex = this.secsPerDivVals.indexOf(0.01);
            this.setTimeSettings({
                timePerDiv: this.secsPerDivVals[this.activeTPDIndex],
                base: 0
            }, false);
        }

    }

    //Called on timeline chart load
    onTimelineLoad(chartInstance) {
        this.timelineChart = chartInstance.chart;
        this.timelineChartComponent = chartInstance;
        this.timelineChartInner = chartInstance.timelineChartInner;
        this.timelineChartReady = true;
        if (this.chartReady === true && this.timelineChartInitialized === false) {
            this.timelineChartInit();
            this.chartLoad.emit(this.chart);
        }
        this.timelineChartEventListener = this.timelineChartComponent.timelineChartEvent.subscribe((data) => {
            if (data.type === 'mousedown') {
                this.timelineChartClick(data.ev);
            }
            else if (data.type === 'mouseup') {
                this.clearMouse();
            }
        });
    }

    timelineChartInit() {
        this.timelineChartInitialized = true;
        this.attachPlotLineEvents();
        let extremesX = this.timelineChart.xAxis[0].getExtremes();
        let extremesY = this.timelineChart.yAxis[0].getExtremes();
        this.timelineBounds = [extremesX.min, extremesX.max, extremesY.dataMin, extremesY.dataMax];
        this.chartBoundsX = this.chart.xAxis[0].getExtremes();
        let left = this.chart.xAxis[0].toValue(this.chart.xAxis[0].toPixels(this.chartBoundsX.min) - 5);
        let right = this.chart.xAxis[0].toValue(this.chart.xAxis[0].toPixels(this.chartBoundsX.max) + 5);
        this.updatePlotBands([2, 3], [[extremesX.min, this.chartBoundsX.min], [this.chartBoundsX.max, extremesX.max]]);
        this.updatePlotLines([0, 1], [left, right]);
    }

    //Called when a point is selected. Sets active series and updates y axis labels
    onPointSelect(event) {
        this.updateYAxisLabels(event.context.series.index + 1);
        this.activeSeries = event.context.series.index + 1;
    }

    //Displays the y axis label for the active series and hide the others
    updateYAxisLabels(newActiveSeries: number) {
        //If LA is set as active series don't do anything
        if (newActiveSeries > this.oscopeChansActive.length) { return; }
        this.chart.yAxis[this.activeSeries - 1].update({
            labels: {
                enabled: false
            },
            title: {
                text: null
            }
        }, false);
        this.chart.yAxis[newActiveSeries - 1].update({
            labels: {
                enabled: true
            },
            title: {
                text: 'Osc ' + (newActiveSeries)
            }
        }, true);
    }

    //Reflows chart to fit container and updates cursor labels if they exist
    redrawChart() {
        if (this.chart != undefined && this.timelineChart != undefined) {
            this.chart.reflow();
            this.timelineChart.reflow();
            console.log('redrawChart()');
        }
        else if (this.chart != undefined) {
            this.chart.reflow();
        }
        if (this.cursorsEnabled) {
            this.updateCursorLabels();
        }
        for (let i = 0; i < this.seriesAnchors.length; i++) {
            this.updateSeriesAnchor(i);
        }
        this.updateTriggerAnchor(this.numSeries[0]);
    }

    decimateData(seriesNum: number, waveform: any, bounds: any) {

        let numPointsInView = Math.round((bounds.max - bounds.min) / waveform.dt);
        if (numPointsInView <= 2000) {
            return this.currentBufferArray[seriesNum];
        }
        let iterator = Math.floor(numPointsInView / 2000);
        let newPoints = [];
        for (let i = 0; i < waveform.y.length; i = iterator + i) {
            newPoints.push(waveform.y[i]);
        }
        let newWaveform = {
            y: [],
            dt: 0,
            t0: 0
        };
        newWaveform.y = newPoints;
        newWaveform.dt = waveform.dt * iterator;
        newWaveform.t0 = waveform.t0;
        return newWaveform;
    }

    decimateTimeline(seriesNum: number, waveform: any) {
        let numPoints = waveform.y.length;
        let iterator = Math.floor(numPoints / 2000);
        if (iterator < 2) {
            return waveform;
        }
        let newPoints = [];
        for (let i = 0; i < waveform.y.length; i = iterator + i) {
            newPoints.push(waveform.y[i]);
        }
        let newWaveform = {
            y: [],
            dt: 0,
            t0: 0
        };
        newWaveform.y = newPoints;
        newWaveform.dt = waveform.dt * iterator;
        newWaveform.t0 = waveform.t0;
        return newWaveform;
    }

    setCurrentBuffer(bufferArray: WaveformComponent[]) {
        this.currentBufferArray = bufferArray;
        if (this.deviceDescriptor !== undefined) {
            this.updateTriggerLine();
            this.updateTriggerAnchor(this.numSeries[0]);
            this.applyPointOfInterest(this.numSeries[0]);
        }
    }

    //Draws a waveform. If axis does not exist for series number, add new axis and then set data
    drawWaveform(seriesNum: number, waveform: any, initialDraw: boolean, ignoreAutoscale?: boolean) {
        let bounds = this.chart.xAxis[0].getExtremes();
        if (bounds.min < waveform.t0 || isNaN(bounds.min) || ignoreAutoscale) { bounds.min = waveform.t0 }
        if (bounds.max > waveform.dt * waveform.y.length || isNaN(bounds.max) || ignoreAutoscale) { bounds.max = waveform.dt * waveform.y.length }
        waveform = this.decimateData(seriesNum, waveform, bounds);
        this.chart.series[seriesNum].setData(waveform.y, false, false, false);

        this.chart.series[seriesNum].update({
            pointStart: waveform.t0,
            pointInterval: waveform.dt
        }, false);

        /*if (initialDraw) {
            this.applyPointOfInterest(seriesNum);
        }*/


        this.chart.redraw(false);
        this.updateCursorLabels();
        this.updateTriggerAnchor(seriesNum);

        if (this.timelineView && initialDraw) {
            let timelineWaveform = this.decimateTimeline(seriesNum, waveform);
            this.timelineChart.series[seriesNum].setData(timelineWaveform.y, false, false, false);
            this.timelineChart.series[seriesNum].update({
                pointStart: timelineWaveform.t0,
                pointInterval: timelineWaveform.dt
            }, false);
            this.timelineChart.redraw(false);
            let extremesX = this.timelineChart.xAxis[0].getExtremes();
            let extremesY = this.timelineChart.yAxis[0].getExtremes();
            this.timelineBounds = [extremesX.min, extremesX.max, extremesY.dataMin, extremesY.dataMax];
        }
    }

    //Remove extra series and axes from the chart
    clearExtraSeries(usedSeries: number[]) {
        this.numSeries = usedSeries;

        for (let i = 0; i < this.oscopeChansActive.length; i++) {
            if (this.oscopeChansActive[i] === false && this.chart.series[i] !== undefined) {
                this.chart.series[i].setData([], false);
                if (this.timelineView && this.timelineChart.series[i] !== undefined) {
                    this.timelineChart.series[i].setData([], false);
                }
                if (this.seriesAnchors[i] !== undefined) {
                    this.seriesAnchors[i].destroy();
                    this.seriesAnchors[i] = undefined;
                }
            }
        }
    }

    //Remove cursors from the chart including their labels
    removeCursors() {
        this.chart.xAxis[0].removePlotLine('cursor0');
        this.chart.xAxis[0].removePlotLine('cursor1');
        this.chart.yAxis[0].removePlotLine('cursor2');
        this.chart.yAxis[0].removePlotLine('cursor3');
        if (this.timelineView) {
            this.timelineChart.xAxis[0].removePlotLine('timelineCursor0');
            this.timelineChart.xAxis[0].removePlotLine('timelineCursor1');
            this.timelineChart.yAxis[0].removePlotLine('timelineCursor2');
            this.timelineChart.yAxis[0].removePlotLine('timelineCursor3');
        }
        for (let i = 0; i < this.cursorAnchors.length; i++) {
            if (typeof (this.cursorAnchors[i]) === 'object') {
                //this.cursorLabel[i].destroy();
                this.cursorAnchors[i].destroy();
                this.cursorAnchors[i] = 'empty';
                //this.cursorLabel[i] = 'empty';
            }
        }
        this.numXCursors = 0;
        this.numYCursors = 0;
        this.cursorPositions = [{ x: null, y: null }, { x: null, y: null }];
    }

    //Add x cursor to the chart and set css properties and event listeners
    addXCursor() {
        let extremes = this.chart.xAxis[0].getExtremes();
        let initialValue: number;
        let style: string = null;
        let color: string = null;
        if (this.numXCursors == 0) {
            initialValue = extremes.min;
            this.activeChannels[0] = parseInt(this.cursor1Chan.slice(-1));
            this.cursorPositions[0] = {
                x: extremes.min,
                y: this.chart.series[this.activeChannels[0] - 1].yData[0]
            };
            style = 'longdash';
            color = this.chart.series[this.activeChannels[0] - 1].color;
        }
        else {
            initialValue = extremes.max;
            this.activeChannels[1] = parseInt(this.cursor2Chan.slice(-1));
            this.cursorPositions[1] = {
                x: extremes.max,
                y: this.chart.series[this.activeChannels[1] - 1].yData[this.chart.series[this.activeChannels[1] - 1].yData.length - 1]
            };
            style = 'shortdash';
            color = this.chart.series[this.activeChannels[1] - 1].color;
        }
        this.cursorRefs[this.numXCursors] = this.chart.xAxis[0].addPlotLine({
            value: initialValue,
            color: color,
            dashStyle: style,
            width: 1,
            zIndex: 100 + this.numXCursors,
            id: 'cursor' + this.numXCursors,
        });
        if (this.timelineView) {
            this.timelineCursorRefs[this.numXCursors] = this.timelineChart.xAxis[0].addPlotLine({
                value: initialValue,
                color: color,
                dashStyle: style,
                width: 1,
                zIndex: 100 + this.numXCursors,
                id: 'timelineCursor' + this.numXCursors
            });
        }
        //this.cursorLabel[this.numXCursors] = this.chart.renderer.text('Cursor ' + this.numXCursors, 100, 100).add();
        this.chart.xAxis[0].plotLinesAndBands[this.numXCursors].svgElem.element.id = 'cursor' + this.numXCursors;
        this.chart.xAxis[0].plotLinesAndBands[this.numXCursors].svgElem.css({
            'cursor': 'pointer'
        })
            .on('mousedown', (event) => {
                this.activeCursor = parseInt(event.target.id.slice(-1)) + 1;
                this.chartBoundsX = this.chart.xAxis[0].getExtremes();
                this.chartBoundsY = this.chart.yAxis[0].getExtremes();
                this.xCursorDragStartPos = event.clientX;
                this.xCursorStartDrag(this.numXCursors, event.clientX);
            })
            .on('touchend', (event) => {
                this.activeCursor = parseInt(event.target.id.slice(-1)) + 1;
                this.chartBoundsX = this.chart.xAxis[0].getExtremes();
                this.chartBoundsY = this.chart.yAxis[0].getExtremes();
                this.xCursorDragStartPos = event.clientX;
                this.xCursorStartDrag(this.numXCursors, event.clientX);
            })
            .on('mouseup', (event) => {
                this.activeCursor = -1;
            })
            .on('touchend', (event) => {
                this.activeCursor = -1;
            });

        let path = ['M', 0, 0, 'L', 5, -9, -5, -9, 'Z'];
        this.cursorAnchors[this.numXCursors] = this.chart.renderer.path(path)
            .attr({
                'stroke-width': 1,
                stroke: color,
                fill: 'black',
                zIndex: 3,
                id: ('cursorAnchor' + this.numXCursors.toString())
            })
            .add()
            .css({
                'cursor': 'pointer'
            })
            .add()
            .on('mousedown', (event) => {
                this.activeCursor = parseInt(event.target.id.slice(-1)) + 1;
                this.chartBoundsX = this.chart.xAxis[0].getExtremes();
                this.chartBoundsY = this.chart.yAxis[0].getExtremes();
                this.xCursorDragStartPos = event.clientX;
                this.xCursorStartDrag(this.numXCursors, event.clientX);
            })
            .on('touchstart', (event) => {
                this.activeCursor = parseInt(event.target.id.slice(-1)) + 1;
                this.chartBoundsX = this.chart.xAxis[0].getExtremes();
                this.chartBoundsY = this.chart.yAxis[0].getExtremes();
                this.xCursorDragStartPos = event.clientX;
                this.xCursorStartDrag(this.numXCursors, event.clientX);
            })
            .on('mouseup', (event) => {
                this.activeCursor = -1;
            })
            .on('touchend', (event) => {
                this.activeCursor = -1;
            });
        this.cursorAnchors[this.numXCursors].translate(this.chart.xAxis[0].toPixels(initialValue) - 1, this.chart.plotTop - 1);
        this.numXCursors++;
    }

    //Add y cursor to the chart and set css properties and event listeners
    addYCursor() {
        let initialValue: number;
        let extremes;
        let style: string = null;
        let color: string = null;
        if (this.numYCursors == 0) {
            extremes = this.chart.yAxis[this.activeChannels[0] - 1].getExtremes();
            initialValue = extremes.min;
            this.activeChannels[0] = parseInt(this.cursor1Chan.slice(-1));
            style = 'longdash';
            color = this.chart.series[this.activeChannels[0] - 1].color;
        }
        else {
            extremes = this.chart.yAxis[this.activeChannels[1] - 1].getExtremes();
            initialValue = extremes.max;
            this.activeChannels[1] = parseInt(this.cursor2Chan.slice(-1));
            style = 'shortdash';
            color = this.chart.series[this.activeChannels[1] - 1].color;
        }
        this.cursorRefs[this.numYCursors + 2] = this.chart.yAxis[this.activeChannels[this.numYCursors] - 1].addPlotLine({
            value: initialValue,
            color: color,
            dashStyle: style,
            width: 1,
            zIndex: 102 + this.numYCursors,
            id: 'cursor' + (this.numYCursors + 2)
        });
        this.cursorPositions[this.numYCursors].y = initialValue;
        if (this.cursorType !== 'track') {
            if (this.timelineView) {
                this.timelineCursorRefs[this.numYCursors + 2] = this.timelineChart.yAxis[0].addPlotLine({
                    value: initialValue,
                    color: color,
                    dashStyle: style,
                    width: 1,
                    zIndex: 100 + this.numXCursors,
                    id: 'timelineCursor' + (this.numYCursors + 2)
                });
            }
            //this.cursorLabel[this.numYCursors + 2] = this.chart.renderer.text('Cursor ' + (this.numYCursors + 2), 100, 500).add();

        let path = ['M', 0, 0, 'L', 9, 5, 0, 10, 'Z'];
        this.cursorAnchors[this.numYCursors + 2] = this.chart.renderer.path(path)
            .attr({
                'stroke-width': 1,
                stroke: color,
                fill: 'black',
                zIndex: 3,
                id: ('cursorAnchor' + (this.numYCursors + 2).toString())
            })
            .css({
                'cursor': 'pointer'
            })
            .add()
            .on('mousedown', (event) => {
                this.activeCursor = parseInt(event.target.id.slice(-1)) + 1;
                this.chartBoundsX = this.chart.xAxis[0].getExtremes();
                this.chartBoundsY = this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].getExtremes();
                this.yCursorStartDrag(this.numYCursors, event.clientY);
            })
            .on('touchstart', (event) => {
                this.activeCursor = parseInt(event.target.id.slice(-1)) + 1;
                this.chartBoundsX = this.chart.xAxis[0].getExtremes();
                this.chartBoundsY = this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].getExtremes();
                this.yCursorStartDrag(this.numYCursors, event.clientY);
            })
            .on('mouseup', (event) => {
                this.activeCursor = -1;
            })
            .on('touchend', (event) => {
                this.activeCursor = -1;
            });

            this.cursorAnchors[this.numYCursors + 2].translate(this.chart.plotLeft - 12, this.chart.yAxis[this.activeChannels[this.numYCursors] - 1].toPixels(initialValue) - 6);
        }
        console.log(this.chart.yAxis[this.activeChannels[this.numYCursors] - 1].plotLinesAndBands, this.numYCursors);
        let lineNum = this.chart.yAxis[this.activeChannels[this.numYCursors] - 1].plotLinesAndBands.length - 1;
        this.chart.yAxis[this.activeChannels[this.numYCursors] - 1].plotLinesAndBands[lineNum].svgElem.element.id = 'cursor' + (this.numYCursors + 2);
        this.chart.yAxis[this.activeChannels[this.numYCursors] - 1].plotLinesAndBands[lineNum].svgElem.css({
            'cursor': 'pointer'
        })

            .on('mousedown', (event) => {
                if (this.cursorType !== 'track') {
                    this.activeCursor = parseInt(event.target.id.slice(-1)) + 1;
                    this.yCursorStartDrag(this.numYCursors + 2, event.clientX);
                }
            })
            .on('touchstart', (event) => {
                if (this.cursorType !== 'track') {
                    this.activeCursor = parseInt(event.target.id.slice(-1)) + 1;
                    this.yCursorStartDrag(this.numYCursors + 2, event.clientX);
                }
            })
            .on('mouseup', (event) => {
                this.activeCursor = -1;
            })
            .on('touchend', (event) => {
                this.activeCursor = -1;
            });

        this.numYCursors++;
    }

    //Called on x cursor mousedown. Add correct mousemove listener and mouseup listener
    xCursorStartDrag(cursorId, xStartPos) {
        if (this.cursorType === 'track') {
            this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.trackCursorDragListener);
            this.oscopeChartInner.nativeElement.addEventListener('touchmove', this.trackCursorDragListener);
        }
        else {
            this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.cursorDragListener);
            this.oscopeChartInner.nativeElement.addEventListener('touchmove', this.cursorDragListener);
        }
        this.oscopeChartInner.nativeElement.addEventListener('mouseup', this.xCursorStopDrag.bind(this));
        this.oscopeChartInner.nativeElement.addEventListener('touchend', this.xCursorStopDrag.bind(this));
    }

    //Called on y cursor mousedown. Add mousemove and mouseup listeners
    yCursorStartDrag(cursorId, xStartPos) {
        this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.yCursorDragListener);
        this.oscopeChartInner.nativeElement.addEventListener('mouseup', this.yCursorStopDrag.bind(this));
        this.oscopeChartInner.nativeElement.addEventListener('touchmove', this.yCursorDragListener);
        this.oscopeChartInner.nativeElement.addEventListener('touchend', this.yCursorStopDrag.bind(this));
    }

    //Called on x cursor mouseup. Remove correct mousemove event listener
    xCursorStopDrag() {
        if (this.cursorType === 'track') {
            this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.trackCursorDragListener);
            this.oscopeChartInner.nativeElement.removeEventListener('touchmove', this.trackCursorDragListener);
        }
        else {
            this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.cursorDragListener);
            this.oscopeChartInner.nativeElement.removeEventListener('touchmove', this.cursorDragListener);
        }
    }

    //Called on y cursor mouseup. Remove mousemove event listener
    yCursorStopDrag() {
        this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.yCursorDragListener);
        this.oscopeChartInner.nativeElement.removeEventListener('touchmove', this.yCursorDragListener);
    }

    //Callback function for mousemove event on a track cursor style
    trackCursorDragListener = function (event) {
        let yCor = event.layerY;
        let xCor = event.layerX;
        if (xCor < this.chart.xAxis[0].toPixels(this.chartBoundsX.min)) {
            xCor = this.chart.xAxis[0].toPixels(this.chartBoundsX.min);
        }
        if (xCor > this.chart.xAxis[0].toPixels(this.chartBoundsX.max)) {
            xCor = this.chart.xAxis[0].toPixels(this.chartBoundsX.max);
        }
        if (yCor > this.chart.yAxis[0].toPixels(this.chartBoundsY.min)) {
            yCor = this.chart.yAxis[0].toPixels(this.chartBoundsY.min);
        }
        if (yCor < this.chart.yAxis[0].toPixels(this.chartBoundsY.max)) {
            yCor = this.chart.yAxis[0].toPixels(this.chartBoundsY.max);
        }
        let xVal = this.chart.xAxis[0].translate(xCor - this.chart.plotLeft, true);
        let pointNum = Math.round((xVal - this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].xData[0]) / this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].options.pointInterval);
        this.cursorRefs[this.activeCursor - 1].options.value = this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].xData[pointNum];
        let lineNum = this.chart.yAxis[this.activeChannels[this.activeCursor - 1] - 1].plotLinesAndBands.length - 1;
        this.chart.yAxis[this.activeChannels[this.activeCursor - 1] - 1].plotLinesAndBands[lineNum * (this.activeCursor - 1)].options.value = this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].yData[pointNum];
        if (this.timelineView) {
            this.timelineCursorRefs[this.activeCursor - 1].options.value = this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].xData[pointNum];
            this.timelineCursorRefs[this.activeCursor - 1].render();
        }

        this.cursorPositions[this.activeCursor - 1] = {
            x: parseFloat(this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].xData[pointNum]),
            y: this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].yData[pointNum]
        };
        this.cursorRefs[this.activeCursor - 1].render();
        this.chart.yAxis[this.activeChannels[this.activeCursor - 1] - 1].plotLinesAndBands[lineNum * (this.activeCursor - 1)].render();
        this.cursorAnchors[this.activeCursor - 1].translate(xCor - 1, this.chart.plotTop - 1);
    }.bind(this);

    //Callback function for mousemove event on a voltage cursor style
    yCursorDragListener = function (event) {
        //SOME WEIRD Y PIXEL OFFSET SO NEED TO CORRECT BY CALCULATING YDELTA AND ADDING THAT TO YVAL CALCULATION
        let yDelta = event.layerY - (this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].toPixels(parseFloat(this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].toValue(event.chartY - this.chart.plotTop))));
        let yVal = parseFloat(this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].toValue(event.chartY - this.chart.plotTop + yDelta)).toFixed(3);
        let xCor = event.layerX;
        let yCor = event.layerY;
        if (event.chartY === undefined) {
            return;
        }
        if (yVal > this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].dataMax) {
            yVal = this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].dataMax;
            yCor = this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].toPixels(yVal);
        }
        else if (yVal < this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].dataMin) {
            yVal = this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].dataMin;
            yCor = this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].toPixels(yVal);
        }
        if (xCor > this.chart.xAxis[0].toPixels(this.chart.xAxis[0].dataMax)) {
            xCor = this.chart.xAxis[0].toPixels(this.chart.xAxis[0].dataMax) - 50;
        }
        else if (xCor < this.chart.xAxis[0].toPixels(this.chart.xAxis[0].dataMin)) {
            xCor = this.chart.xAxis[0].toPixels(this.chart.xAxis[0].dataMin);
        }
        if (yCor > this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].toPixels(this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].min)) {
            yCor = this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].toPixels(this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].min);
        }
        let lineNum = this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].plotLinesAndBands.length - 1;
        console.log(lineNum * (this.activeCursor - 3));
        this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].plotLinesAndBands[lineNum * (this.activeCursor - 3)].options.value = yVal;
        if (this.timelineView) {
            console.log('timeline');
            this.timelineChart.yAxis[0].plotLinesAndBands[this.activeCursor - 3].options.value = yVal;
            console.log('after timeline');
            this.timelineChart.yAxis[0].plotLinesAndBands[this.activeCursor - 3].render();
        }
        this.cursorPositions[this.activeCursor - 3] = {
            y: parseFloat(yVal)
        }
        this.chart.yAxis[this.activeChannels[this.activeCursor - 3] - 1].plotLinesAndBands[lineNum * (this.activeCursor - 3)].render();
        /*this.cursorLabel[this.activeCursor - 3].attr({
            text: yVal + 'V', 
            x: xCor,
            y: yCor - 10,
            zIndex: 99 + this.activeCursor
        });*/
        this.cursorAnchors[this.activeCursor - 1].translate(this.chart.plotLeft - 12, yCor - 5);
    }.bind(this);

    //Callback function for mousemove event on a time cursor style
    cursorDragListener = function (event) {
        let yCor = event.layerY;
        let xCor = event.layerX;
        if (xCor < this.chart.xAxis[0].toPixels(this.chartBoundsX.min)) {
            xCor = this.chart.xAxis[0].toPixels(this.chartBoundsX.min);
        }
        else if (xCor > this.chart.xAxis[0].toPixels(this.chartBoundsX.max)) {
            xCor = this.chart.xAxis[0].toPixels(this.chartBoundsX.max);
        }
        if (yCor > this.chart.yAxis[this.activeChannels[this.activeCursor - 1] - 1].toPixels(this.chartBoundsY.min)) {
            yCor = this.chart.yAxis[this.activeChannels[this.activeCursor - 1] - 1].toPixels(this.chartBoundsY.min);
        }
        else if (yCor < this.chart.yAxis[this.activeChannels[this.activeCursor - 1] - 1].toPixels(this.chartBoundsY.max)) {
            yCor = this.chart.yAxis[this.activeChannels[this.activeCursor - 1] - 1].toPixels(this.chartBoundsY.max);
        }

        let xVal = this.chart.xAxis[0].translate(xCor - this.chart.plotLeft, true);
        let pointNum = Math.round((xVal - this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].xData[0]) / this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].options.pointInterval);
        this.cursorRefs[this.activeCursor - 1].options.value = xVal;
        if (this.timelineView) {
            this.timelineCursorRefs[this.activeCursor - 1].options.value = xVal;
            this.timelineCursorRefs[this.activeCursor - 1].render();
        }
        this.cursorPositions[this.activeCursor - 1] = {
            x: parseFloat(xVal),
            y: this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].data[pointNum].y
        }
        this.cursorRefs[this.activeCursor - 1].render();
        
        this.cursorAnchors[this.activeCursor - 1].translate(xCor - 1, this.chart.plotTop - 1);
    }.bind(this);

    setTitle(newTitle: string) {
        this.chart.setTitle({
            text: newTitle
        });
    }

    //Get cursor position differences and return an array of data
    getCursorInfo(cursorInfo: string) {
        if (cursorInfo === 'xDelta') {
            let timePerDiv = Math.abs(this.chart.xAxis[0].max - this.chart.xAxis[0].min) / 10;
            let i = 0;
            let unit = '';
            while (timePerDiv < 1) {
                i++;
                timePerDiv = timePerDiv * 1000;
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

            let xDelta = (Math.abs(this.cursorPositions[1].x - this.cursorPositions[0].x) * Math.pow(1000, i)).toFixed(0) + unit;
            return xDelta;
        }
        else if (cursorInfo === 'yDelta') {
            let vPerDiv = Math.abs(this.chart.yAxis[this.activeChannels[1] - 1].max - this.chart.yAxis[this.activeChannels[0] - 1].min) / 10;
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

            let yDelta = (Math.abs(this.cursorPositions[1].y - this.cursorPositions[0].y) * Math.pow(1000, i)).toFixed(0) + unit;
            return yDelta;
        }
        else if (cursorInfo === 'xFreq') {
            if (this.cursorPositions[1].x === this.cursorPositions[0].x) { return 'Inf' };
            let freqRange = 1 / Math.abs(this.cursorPositions[1].x - this.cursorPositions[0].x);
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

            let xFreq = ((1 / Math.abs(this.cursorPositions[1].x - this.cursorPositions[0].x)) / Math.pow(1000, i)).toFixed(0) + unit;
            return xFreq;
        }
        else if (cursorInfo === 'cursorPosition0' || cursorInfo === 'cursorPosition1') {
            let index = cursorInfo.slice(-1);
            if (this.cursorPositions[index].x !== undefined) {
                let timePerDiv = Math.abs(this.chart.xAxis[0].max - this.chart.xAxis[0].min) / 10;
                let i = 0;
                let unit = '';
                while (timePerDiv < 1) {
                    i++;
                    timePerDiv = timePerDiv * 1000;
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

                let cursorPosition = (this.cursorPositions[index].x * Math.pow(1000, i)).toFixed(0) + unit;
                let vPerDiv = Math.abs(this.chart.yAxis[this.activeChannels[index] - 1].max - this.chart.yAxis[this.activeChannels[index] - 1].min) / 10;
                i = 0;
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
                cursorPosition += ' (' + (this.cursorPositions[index].y * Math.pow(1000, i)).toFixed(0) + unit + ')';
                return cursorPosition;
            }
            else {
                let i = 0;
                let unit = '';
                let vPerDiv = Math.abs(this.chart.yAxis[this.activeChannels[index] - 1].max - this.chart.yAxis[this.activeChannels[index] - 1].min) / 10;
                i = 0;
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
                let cursorPosition = (this.cursorPositions[index].y * Math.pow(1000, i)).toFixed(0) + unit;
                return cursorPosition;
            }

        }

    }

    //Exports series data from chart to a csv on client side
    exportCsv(fileName: string) {
        if (this.chart.series.length == 0) { return; }
        fileName = fileName + '.csv';
        let csvContent = 'data:text/csv;charset=utf-8,';
        let maxLength = 0;
        for (let i = 0; i < this.chart.series.length; i++) {
            if (this.chart.series[i].yData.length > maxLength) {
                maxLength = this.chart.series[i].yData.length;
            }
        }
        for (let i = 0; i < maxLength; i++) {
            let rowData = [];
            rowData.push(i * this.chart.series[0].options.pointInterval);
            for (let j = 0; j < this.chart.series.length; j++) {
                if (this.chart.series[j].yData[i] !== undefined) {
                    rowData.push(this.chart.series[j].yData[i]);
                }
                else {
                    rowData.push('');
                }
            }
            csvContent += rowData.join(',') + '\n';
        }
        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
    }

    //Opens cursor modal menu and sets data on modal dismiss
    openCursorModal() {
        let modal = this.modalCtrl.create(ModalCursorPage, {
            cursorType: this.cursorType,
            cursor1Chan: this.cursor1Chan,
            cursor2Chan: this.cursor2Chan,
            chartComponent: this
        });
        modal.onDidDismiss(data => {
            if (data.save) {
                this.cursorType = data.cursorType;
                this.cursor1Chan = data.cursor1Chan;
                this.cursor2Chan = data.cursor2Chan;
                this.handleCursors();
            }
            setTimeout(() => {
                this.chart.reflow();
            }, 50);
        });
        modal.present();
    }

    openMathModal() {
        console.log(this.currentBufferArray);
        if (this.currentBufferArray.length === 0) { return; }
        let modal = this.modalCtrl.create(MathModalPage, {
            chartComponent: this
        });
        modal.onDidDismiss(data => {
            console.log('rip math modal');
        });
        modal.present();
    }

    //Adds correct cursors from selection
    handleCursors() {
        this.removeCursors();
        if (this.cursorType === 'time') {
            this.addXCursor();
            this.addXCursor();
        }
        else if (this.cursorType === 'disabled') {

        }
        else if (this.cursorType === 'track') {
            this.addXCursor();
            this.addXCursor();
            this.addYCursor();
            this.addYCursor();
        }
        else if (this.cursorType === 'voltage') {
            this.addYCursor();
            this.addYCursor();
        }
        else {
            console.log('error in handle cursors()');
        }
    }

    //Enable cursors on the chart component. Called after chart initialization
    enableCursors() {
        this.cursorsEnabled = true;
    }

    //Called on chart mousedown. Sets either vertical or horizontal pan listener
    onChartClick(event) {
        this.oscopeChartInner.nativeElement.addEventListener('touchmove', this.panListener);
        //check cursors enabled to see if the chart is 'interactive'. Added to remove pan from fgen config modal
        if (event.target.localName === 'rect' && this.oscopeChartInner !== undefined && event.target.id === '' && this.cursorsEnabled) {
            this.canPan = true;
            this.xPositionPixels = event.chartX;
            this.yPositionPixels = event.chartY;
            if (event.shiftKey) {
                this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.verticalOffsetListener);
                this.oscopeChartInner.nativeElement.addEventListener('touchmove', this.verticalOffsetListener);
            }
            else {
                this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.panListener);
                this.oscopeChartInner.nativeElement.addEventListener('touchmove', this.panListener);
            }
        }
    }

    //Called on chart mouseup. Removes pan listeners
    clearMouse() {
        this.canPan = false;
        if (this.oscopeChartInner !== undefined) {
            this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.panListener);
            this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.verticalOffsetListener);
            this.oscopeChartInner.nativeElement.removeEventListener('touchmove', this.panListener);
            this.oscopeChartInner.nativeElement.removeEventListener('touchmove', this.verticalOffsetListener);

            if (this.timelineView && this.timelineChartInner !== undefined) {
                this.timelineChartInner.nativeElement.removeEventListener('mousemove', this.timelineWhiteDragListener);
                this.timelineChartInner.nativeElement.removeEventListener('mousemove', this.timelineDragListener);
                this.timelineChartInner.nativeElement.removeEventListener('touchmove', this.timelineWhiteDragListener);
                this.timelineChartInner.nativeElement.removeEventListener('touchmove', this.timelineDragListener);
                this.inTimelineDrag = false;
            }
        }
    }

    //Callback function for panning
    panListener = function (event) {
        let newVal = this.chart.xAxis[0].toValue(event.chartX) || this.chart.xAxis[0].toValue(event.targetTouches[0].pageX - this.chart.plotLeft);
        let oldValinNewWindow = this.chart.xAxis[0].toValue(this.xPositionPixels);
        let difference = newVal - oldValinNewWindow;
        this.setXExtremes(difference);
        this.updateCursorLabels();
        this.updateTriggerAnchor(this.numSeries[0]);
        this.xPositionPixels = event.chartX || (event.targetTouches[0].pageX - this.chart.plotLeft);
    }.bind(this);

    //Callback function for vertical panning of a series
    verticalOffsetListener = function (event) {

        let newVal = parseFloat(this.chart.yAxis[this.activeSeries - 1].toValue(event.chartY));
        let oldValinNewWindow = parseFloat(this.chart.yAxis[this.activeSeries - 1].toValue(this.yPositionPixels));
        let difference = newVal - oldValinNewWindow;
        let seriesSettings = {
            seriesNum: this.activeSeries - 1,
            voltsPerDiv: this.voltDivision[this.activeSeries - 1],
            voltBase: parseFloat(this.voltBase[this.activeSeries - 1]) - difference
        };
        this.setYExtremes(seriesSettings);
        this.voltBase[this.activeSeries - 1] = parseFloat((parseFloat(this.voltBase[this.activeSeries - 1]) - difference).toFixed(3));
        this.yPositionPixels = event.chartY;

        this.seriesAnchors[this.activeSeries - 1].translate(this.chart.plotLeft - 12, this.chart.yAxis[this.activeSeries - 1].toPixels(this.currentBufferArray[this.activeSeries - 1].seriesOffset / 1000) - 6);
    }.bind(this);

    //Sets x extremes based on position change from previos position
    setXExtremes(positionChange: number) {
        let newPos = this.base - positionChange;
        let min = newPos - this.timeDivision * 5;
        let max = newPos + this.timeDivision * 5;
        this.chart.xAxis[0].setExtremes(min, max, true, false);
        this.base = newPos;
        if (this.timelineView) {
            this.updatePlotBands([2, 3], [[this.timelineBounds[0], min], [max, this.timelineBounds[1]]]);
            let val1 = this.timelineChart.xAxis[0].toValue(this.timelineChart.xAxis[0].toPixels(min) - 5);
            let val2 = this.timelineChart.xAxis[0].toValue(this.timelineChart.xAxis[0].toPixels(max) + 5);
            this.updatePlotLines([0, 1], [val1, val2]);
        }
    }

    //Sets y extremes based on an object containing a voltBase, voltsPerDivision, and a series number
    setYExtremes(seriesSettings: any) {
        let offset = parseFloat(seriesSettings.voltBase);
        let min = offset - (parseFloat(seriesSettings.voltsPerDiv) * 5);
        let max = offset + (parseFloat(seriesSettings.voltsPerDiv) * 5);
        this.chart.yAxis[seriesSettings.seriesNum].setExtremes(min, max, true, false);
        this.updateCursorLabels();
        this.updateSeriesAnchor(seriesSettings.seriesNum);
    }

    //Called when chart changes extremes or position. Moves cursor labels to new cursor position
    updateCursorLabels() {
        if (this.cursorType === 'disabled') {
            return;
        }

        else if (this.cursorType === 'time' || this.cursorType === 'track') {
            for (let i = 0; i < 2; i++) {
                //let pointNum = Math.round((this.chart.xAxis[0].plotLinesAndBands[i].options.value - this.chart.xAxis[0].plotLinesAndBands[i].axis.dataMin) / this.chart.series[0].pointInterval);
                //if (typeof(this.cursorLabel[i]) === 'object') {
                /*this.cursorLabel[i].attr({
                    x: this.chart.xAxis[0].toPixels(this.chart.xAxis[0].plotLinesAndBands[i].options.value),
                });*/
                
                this.cursorAnchors[i].translate(this.chart.xAxis[0].toPixels(this.chart.xAxis[0].plotLinesAndBands[i + 1].options.value) - 1, this.chart.plotTop - 1);
                //}
            }
        }

        else if (this.cursorType === 'voltage') {
            for (let i = 2; i < 4; i++) {
                //let pointNum = Math.round((this.chart.xAxis[0].plotLinesAndBands[i].options.value - this.chart.xAxis[0].plotLinesAndBands[i].axis.dataMin) / this.chart.series[0].pointInterval);
                //if (typeof(this.cursorLabel[i]) === 'object') {
                /*this.cursorLabel[i].attr({
                    y: this.chart.yAxis[0].toPixels(this.chart.yAxis[0].plotLinesAndBands[i - 2].options.value),
                });*/
                let lineNum = this.chart.yAxis[this.activeChannels[i - 2] - 1].plotLinesAndBands.length - 1;

                this.cursorAnchors[i].translate(this.chart.plotLeft - 12, this.chart.yAxis[this.activeChannels[i - 2] - 1].toPixels(this.chart.yAxis[this.activeChannels[i - 2] - 1].plotLinesAndBands[lineNum * (i - 2)].options.value) - 6);
                //}
            }
        }

        else {
            console.log('error updating cursor labels');
        }

    }

    //Set time settings (base and time/div) from an object containing the base and timeDivision
    setTimeSettings(timeObj: any, autoscale: boolean) {
        this.timeDivision = parseFloat(timeObj.timePerDiv);
        this.base = parseFloat(timeObj.base);
        let min = this.base - (this.timeDivision * 5);
        let max = this.base + (this.timeDivision * 5);
        if (this.currentBufferArray[0] !== undefined) {
            this.chart.xAxis[0].setExtremes(min, max, false, false);
            for (let i = 0; i < this.oscopeChansActive.length; i++) {
                if (this.oscopeChansActive[i] === true && this.currentBufferArray[i].y !== undefined) {
                    this.drawWaveform(i, this.currentBufferArray[i], false, autoscale);
                }
            }
        }
        else {
            this.chart.xAxis[0].setExtremes(min, max, true, false);
        }

        if (this.timelineView) {
            this.updatePlotBands([2, 3], [[this.timelineBounds[0], min], [max, this.timelineBounds[1]]]);
            let val1 = this.timelineChart.xAxis[0].toValue(this.timelineChart.xAxis[0].toPixels(min) - 5);
            let val2 = this.timelineChart.xAxis[0].toValue(this.timelineChart.xAxis[0].toPixels(max) + 5);
            this.updatePlotLines([0, 1], [val1, val2]);
        }
        this.updateCursorLabels();
        this.updateTriggerAnchor(this.numSeries[0]);
    }

    //Set series settings based on an object containing the series number, volts per division, and base
    setSeriesSettings(seriesSettings: any) {
        this.voltDivision[seriesSettings.seriesNum] = seriesSettings.voltsPerDiv;
        this.voltBase[seriesSettings.seriesNum] = seriesSettings.voltBase;
        this.setYExtremes(seriesSettings);
    }

    //Set active series and update labels
    setActiveSeries(seriesNum: number) {
        this.updateYAxisLabels(seriesNum);
        this.activeSeries = seriesNum;
        this.updateCursorLabels();
        this.updateTriggerAnchor(seriesNum);
        for (let i = 0; i < this.seriesAnchors.length; i++) {
            this.updateSeriesAnchor(i);
        }
    }

    addSeries(seriesNum: number) {
        if (this.chart.series.length !== seriesNum) { return; }
        let options = {
            data: [],
            allowPointSelect: true,
            yAxis: seriesNum,
            visible: false
        };
        let timelineOptions = {
            data: []
        };
        this.chart.addSeries(options, false, false);
        if (this.timelineView) {
            this.timelineChart.addSeries(timelineOptions, false, false);
        }
    }

    //Add y axis to chart and initialize with correct settings
    addYAxis(axisNum: number) {
        if (this.chart.yAxis.length !== axisNum) {
            return;
        }
        let options = {
            gridLineWidth: 1,
            gridLineColor: '#666666',
            offset: 0,
            labels: {
                style: {
                    color: '#666666'
                },
                enabled: false,
                formatter: function () {
                    let vPerDiv = Math.abs(this.chart.yAxis[axisNum].max - this.chart.yAxis[axisNum].min) / 10;
                    let i = 0;
                    let unit = '';
                    while (vPerDiv < 1) {
                        i++;
                        vPerDiv = vPerDiv * 1000;
                    }
                    this.value = (parseFloat(this.value) * Math.pow(1000, i)).toFixed(0);
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
                    return this.value + unit;
                }
            },
            tickPositioner: function () {
                let numTicks = 11;
                let ticks = [];
                let min = this.chart.yAxis[axisNum].min;
                let max = this.chart.yAxis[axisNum].max;
                let delta = (max - min) / (numTicks - 1);
                for (var i = 0; i < numTicks; i++) {
                    ticks[i] = (min + i * delta).toFixed(3);
                }
                return ticks;
            },
            title: {
                text: null
            }
        };
        this.chart.addAxis(options, false, false, false);
    }

    //Autoscale all axes on chart
    autoscaleAllAxes() {
        this.autoscaleAxis('x', 0);
        for (let i = 0; i < this.chart.yAxis.length; i++) {
            this.autoscaleAxis('y', i);
        }
    }

    //Autoscales single axis
    autoscaleAxis(axis: string, axisIndex: number) {
        if (axis === 'x') {
            let secsPerDiv = (this.chart.xAxis[0].dataMax - this.chart.xAxis[0].dataMin) / 10;
            let i = 0;
            while (secsPerDiv > this.secsPerDivVals[i] && i < this.secsPerDivVals.length - 1) {
                i++;
            }
            this.activeTPDIndex = i;
            this.timeDivision = this.secsPerDivVals[i];
            this.base = ((this.chart.xAxis[0].dataMax + this.chart.xAxis[0].dataMin) / 2);
            this.setTimeSettings({
                timePerDiv: this.timeDivision,
                base: this.base
            }, true);
            if (this.timelineView) {
                let extremes = this.chart.xAxis[0].getExtremes();
                this.updatePlotBands([2, 3], [[this.timelineBounds[0], extremes.dataMin], [extremes.dataMax, this.timelineBounds[1]]]);
                let left = this.chart.xAxis[0].toValue(this.chart.xAxis[0].toPixels(extremes.dataMin) - 5);
                let right = this.chart.xAxis[0].toValue(this.chart.xAxis[0].toPixels(extremes.dataMax) + 5);
                this.updatePlotLines([0, 1], [left, right]);
            }
        }
        else if (axis === 'y') {
            if (this.chart.yAxis[axisIndex].dataMin === null && this.chart.yAxis[axisIndex].dataMax === null) {
                return;
            }
            if (this.oscopeChansActive[axisIndex] === false) {
                return;
            }
            if (this.currentBufferArray[axisIndex].y === undefined) {
                return;
            }
            let voltsPerDiv = (this.chart.yAxis[axisIndex].dataMax - this.chart.yAxis[axisIndex].dataMin) / 10;
            let i = 0;
            while (voltsPerDiv > this.voltsPerDivVals[i] && i < this.voltsPerDivVals.length - 1) {
                i++;
            }
            this.activeVPDIndex[axisIndex] = i;
            this.voltBase[axisIndex] = (this.chart.yAxis[axisIndex].dataMax + this.chart.yAxis[axisIndex].dataMin) / 2;
            this.voltBase[axisIndex] = this.voltBase[axisIndex] - ((this.chart.yAxis[axisIndex].dataMax + this.chart.yAxis[axisIndex].dataMin) / 2) % this.voltsPerDivVals[this.activeVPDIndex[axisIndex]];
            this.voltDivision[axisIndex] = this.voltsPerDivVals[i];
            this.setSeriesSettings({
                seriesNum: axisIndex,
                voltsPerDiv: this.voltDivision[axisIndex],
                voltBase: this.voltBase[axisIndex]
            });
            this.updateSeriesAnchor(axisIndex);
        }
        else {
            console.log('invalid axis');
        }
        this.updateCursorLabels();
        this.updateTriggerAnchor(axisIndex);
    }

    //Enables timeline view. Called when chart is initialized
    enableTimelineView() {
        this.timelineView = true;
    }

    enableMath() {
        this.mathEnabled = true;
    }

    //Determines if cursors and timeline view is enabled on chart component
    isCursorTimeline() {
        if (this.cursorsEnabled && this.timelineView) {
            return true;
        }
        return false;
    }

    //Determines if only cursors are enabled on chart component
    isCursorOnly() {
        if (this.cursorsEnabled && !this.timelineView) {
            return true;
        }
        return false;
    }

    //Determines if only timeline view is enabled on chart component
    isTimelineOnly() {
        if (!this.cursorsEnabled && this.timelineView) {
            return true;
        }
        return false;
    }

    //Determines if timeline view and cursors are disabled on chart component
    isVanilla() {
        if (!this.cursorsEnabled && !this.timelineView) {
            return true;
        }
        return false;
    }

    //Called on mousedown event on timeline chart containing div. Sets mousemove listener
    timelineChartClick(event) {
        let chartExtremes = this.chart.xAxis[0].getExtremes();
        let value = this.timelineChart.xAxis[0].toValue(event.chartX)
        if (value > chartExtremes.min && value < chartExtremes.max && !this.inTimelineDrag) {
            this.xPositionPixels = event.chartX;
            this.timelineChartInner.nativeElement.addEventListener('mousemove', this.timelineWhiteDragListener);
            this.timelineChartInner.nativeElement.addEventListener('touchmove', this.timelineWhiteDragListener);
        }
        else if (!this.inTimelineDrag) {
            let oldValinNewWindow = this.base;
            let difference = oldValinNewWindow - value;
            this.setXExtremes(difference);
            this.updateCursorLabels();
            this.updateTriggerAnchor(this.numSeries[0]);
            this.xPositionPixels = event.chartX;
            this.timelineChartInner.nativeElement.addEventListener('mousemove', this.timelineWhiteDragListener);
            this.timelineChartInner.nativeElement.addEventListener('touchmove', this.timelineWhiteDragListener);
        }
    }

    //Attach events to timeline chart plot lines
    attachPlotLineEvents() {
        for (let i = 0; i < 2; i++) {
            if (this.timelineChart.xAxis[0].plotLinesAndBands[i].svgElem !== undefined) {
                this.timelineChart.xAxis[0].plotLinesAndBands[i].svgElem.css({
                    'cursor': 'pointer'
                })
                    .on('mousedown', (event) => {
                        this.inTimelineDrag = true;
                        //console.log('mousedown' + i);
                        this.startTimelineDrag(i);
                    })
                    .on('touchstart', (event) => {
                        this.inTimelineDrag = true;
                        //console.log('mousedown' + i);
                        this.startTimelineDrag(i);
                    })
                    .on('mouseup', (event) => {
                        this.inTimelineDrag = false;
                        //console.log('mouseup' + i);
                        this.clearDragListener(i);
                    })
                    .on('touchend', (event) => {
                        this.inTimelineDrag = false;
                        //console.log('mouseup' + i);
                        this.clearDragListener(i);
                    });
            }

        }

    }

    //Called on plot line mousedown and sets mousemove event listener
    startTimelineDrag(lineNum: number) {
        this.timelineChartInner.nativeElement.addEventListener('mousemove', this.timelineDragListener);
        this.timelineChartInner.nativeElement.addEventListener('touchmove', this.timelineDragListener);
        this.activeTimeLine = lineNum;
        this.chartBoundsX = this.chart.xAxis[0].getExtremes();
    }

    //Called on plot line mouseup and removes mousemove event listener
    clearDragListener(lineNum: number) {
        this.timelineChartInner.nativeElement.removeEventListener('mousemove', this.timelineDragListener);
        this.timelineChartInner.nativeElement.removeEventListener('touchmove', this.timelineDragListener);
        this.activeTimeLine = -1;
    }

    //Callback function for timeline plot line mousemove events
    timelineDragListener = function (event) {
        //let newVal = this.timelineChart.xAxis[0].toValue(event.chartX);
        let newVal: number;
        let xCor: number;

        if (this.activeTimeLine === 0) {
            let secsPerDiv: number = (this.timelineChart.xAxis[0].plotLinesAndBands[3].options.from - this.timelineChart.xAxis[0].toValue(event.chartX)) / 10;
            if (secsPerDiv < 0) {
                return;
            }
            let i = 1;
            let delta = Math.abs(secsPerDiv - this.secsPerDivVals[0]);
            while (Math.abs(secsPerDiv - this.secsPerDivVals[i]) < delta) {
                delta = Math.abs(secsPerDiv - this.secsPerDivVals[i]);
                i++;
            }
            --i;
            if (this.timeDivision === this.secsPerDivVals[i]) {
                return;
            }
            //Seconds per division has changed
            this.timeDivision = this.secsPerDivVals[i];
            this.activeTPDIndex = i;
            xCor = this.timelineChart.xAxis[0].toPixels(this.timelineChart.xAxis[0].plotLinesAndBands[3].options.from - this.secsPerDivVals[i] * 10) - 5;
            if (event.chartX > this.timelineChart.xAxis[0].toPixels(this.timelineChart.xAxis[0].plotLinesAndBands[3].options.from)) {
                xCor = this.timelineChart.xAxis[0].toPixels(this.timelineChart.xAxis[0].plotLinesAndBands[3].options.from) - 5;
                newVal = this.timelineChart.xAxis[0].plotLinesAndBands[3].options.from;
            }
            newVal = this.timelineChart.xAxis[0].plotLinesAndBands[3].options.from - this.secsPerDivVals[i] * 10;
            this.updatePlotBands([2], [[this.timelineBounds[0], newVal]]);
            this.timelineChart.xAxis[0].plotLinesAndBands[0].options.value = this.timelineChart.xAxis[0].toValue(xCor);
            this.timelineChart.xAxis[0].plotLinesAndBands[0].render();
            this.chart.xAxis[0].setExtremes(this.timelineChart.xAxis[0].toValue(xCor + 5), this.chartBoundsX.max);
        }
        else if (this.activeTimeLine === 1) {
            let secsPerDiv: number = (this.timelineChart.xAxis[0].toValue(event.chartX) - this.timelineChart.xAxis[0].plotLinesAndBands[2].options.to) / 10;
            if (secsPerDiv < 0) {
                return;
            }
            let i = 1;
            let delta = Math.abs(secsPerDiv - this.secsPerDivVals[0]);
            while (Math.abs(secsPerDiv - this.secsPerDivVals[i]) < delta) {
                delta = Math.abs(secsPerDiv - this.secsPerDivVals[i]);
                i++;
            }
            --i;
            if (this.timeDivision === this.secsPerDivVals[i]) {
                return;
            }
            //Seconds per division have changed
            this.timeDivision = this.secsPerDivVals[i];
            this.activeTPDIndex = i;
            xCor = this.timelineChart.xAxis[0].toPixels(this.timelineChart.xAxis[0].plotLinesAndBands[2].options.to + this.secsPerDivVals[i] * 10) + 5;
            if (event.chartX < this.timelineChart.xAxis[0].toPixels(this.timelineChart.xAxis[0].plotLinesAndBands[2].options.to)) {
                xCor = this.timelineChart.xAxis[0].toPixels(this.timelineChart.xAxis[0].plotLinesAndBands[2].options.to) + 5;
                newVal = this.timelineChart.xAxis[0].plotLinesAndBands[2].options.to;
            }
            newVal = this.timelineChart.xAxis[0].plotLinesAndBands[2].options.to + this.secsPerDivVals[i] * 10;
            this.updatePlotBands([3], [[newVal, this.timelineBounds[1]]]);
            this.timelineChart.xAxis[0].plotLinesAndBands[1].options.value = this.timelineChart.xAxis[0].toValue(xCor);
            this.timelineChart.xAxis[0].plotLinesAndBands[1].render();
            this.chart.xAxis[0].setExtremes(this.chartBoundsX.min, this.timelineChart.xAxis[0].toValue(xCor - 5));
        }
        let newExtremes = this.chart.xAxis[0].getExtremes();
        this.base = ((newExtremes.min + newExtremes.max) / 2);
        //this.timeDivision = ((newExtremes.max - newExtremes.min) / 10).toFixed(3);
        this.updateCursorLabels();
        this.updateTriggerAnchor(this.numSeries[0]);
    }.bind(this);

    //Callback for timeline plot mousemove events to pan user view of chart
    timelineWhiteDragListener = function (event) {
        let newVal = this.timelineChart.xAxis[0].toValue(event.chartX);
        let oldValinNewWindow = this.timelineChart.xAxis[0].toValue(this.xPositionPixels);
        let difference = oldValinNewWindow - newVal;
        this.setXExtremes(difference);
        this.updateCursorLabels();
        this.updateTriggerAnchor(this.numSeries[0]);
        this.xPositionPixels = event.chartX;
    }.bind(this);

    //Set correct values for plot bands
    updatePlotBands(indices: number[], values: Array<number[]>) {
        for (let i = 0; i < indices.length; i++) {
            this.timelineChart.xAxis[0].plotLinesAndBands[indices[i]].options.from = values[i][0];
            this.timelineChart.xAxis[0].plotLinesAndBands[indices[i]].options.to = values[i][1];
            this.timelineChart.xAxis[0].plotLinesAndBands[indices[i]].render();
        }
    }

    //Set correct values for plot lines
    updatePlotLines(indices: number[], values: number[]) {
        for (let i = 0; i < indices.length; i++) {
            this.timelineChart.xAxis[0].plotLinesAndBands[indices[i]].options.value = values[i];
            this.timelineChart.xAxis[0].plotLinesAndBands[indices[i]].render()
        }
    }

    decrementVPD(seriesNum) {
        if (this.activeVPDIndex[seriesNum] < 1) {
            return;
        }
        this.activeVPDIndex[seriesNum]--;
        this.setSeriesSettings({
            voltsPerDiv: this.voltsPerDivVals[this.activeVPDIndex[seriesNum]],
            voltBase: this.voltBase[seriesNum],
            seriesNum: seriesNum
        });
    }

    incrementVPD(seriesNum) {
        if (this.activeVPDIndex[seriesNum] > this.voltsPerDivOpts.length - 2) {
            return;
        }
        this.activeVPDIndex[seriesNum]++;
        this.setSeriesSettings({
            voltsPerDiv: this.voltsPerDivVals[this.activeVPDIndex[seriesNum]],
            voltBase: this.voltBase[seriesNum],
            seriesNum: seriesNum
        });
    }

    incrementOffset(seriesNum) {
        this.voltBase[seriesNum] = this.voltBase[seriesNum] + this.voltDivision[seriesNum];
        this.setSeriesSettings({
            voltsPerDiv: this.voltDivision[seriesNum],
            voltBase: this.voltBase[seriesNum],
            seriesNum: seriesNum
        });
    }

    decrementOffset(seriesNum) {
        this.voltBase[seriesNum] = this.voltBase[seriesNum] - this.voltDivision[seriesNum];
        this.setSeriesSettings({
            voltsPerDiv: this.voltDivision[seriesNum],
            voltBase: this.voltBase[seriesNum],
            seriesNum: seriesNum
        });
    }

    decrementTPD(seriesNum) {
        if (this.activeTPDIndex < 1) {
            return;
        }
        this.activeTPDIndex--;
        this.setTimeSettings({
            timePerDiv: this.secsPerDivVals[this.activeTPDIndex],
            base: this.base
        }, false);
    }

    incrementTPD(seriesNum) {
        if (this.activeTPDIndex > this.secsPerDivOpts.length - 2) {
            return;
        }
        this.activeTPDIndex++;
        this.setTimeSettings({
            timePerDiv: this.secsPerDivVals[this.activeTPDIndex],
            base: this.base
        }, false);
    }

    incrementBase() {
        this.base = this.base + this.timeDivision;
        this.setTimeSettings({
            timePerDiv: this.timeDivision,
            base: this.base
        }, false);
    }

    decrementBase() {
        this.base = this.base - this.timeDivision;
        this.setTimeSettings({
            timePerDiv: this.timeDivision,
            base: this.base
        }, false);
    }

    toggleVisibility(seriesNum: number) {
        this.oscopeChansActive[seriesNum] = !this.oscopeChansActive[seriesNum];
        if (this.chart.series[seriesNum] === undefined) {
            return;
        }
        if (this.seriesAnchors[seriesNum] !== undefined && this.oscopeChansActive[seriesNum] === false) {
            this.removeSeriesAnchor(seriesNum);
        }
        this.chart.series[seriesNum].setVisible(!this.chart.series[seriesNum].visible);
        this.updateSeriesAnchor(seriesNum);
    }

    getSeriesVisibility(seriesNum: number) {
        if (this.chart.series[seriesNum] === undefined) { return this.oscopeChansActive[seriesNum]; }
        return this.chart.series[seriesNum].visible;
    }

    getSeriesColor(seriesNum: number) {
        if (this.chart.series[seriesNum] === undefined) { return this.colorArray[seriesNum] }
        return this.chart.series[seriesNum].color;
    }

    //---------------------------------- MATH INFO ------------------------------

    addMathInfo(mathInfo: string, seriesNum: number, maxIndex: number, minIndex: number) {
        console.log(mathInfo, seriesNum);

        for (let i = 0; i < this.selectedMathInfo.length; i++) {
            if (this.selectedMathInfo[i].measurement === mathInfo && this.selectedMathInfo[i].channel === seriesNum) {
                this.selectedMathInfo.splice(i, 1);
                return;
            }
        }
        if (this.selectedMathInfo.length === 4) {
            this.selectedMathInfo.shift();
        }
        this.selectedMathInfo.push({
            measurement: mathInfo,
            channel: seriesNum,
            value: 'err'
        });
        this.updateMath();
    }

    updateMath() {
        let extremes = this.chart.xAxis[0].getExtremes();
        let chartMin = extremes.min;
        let chartMax = extremes.max;
        if (extremes.dataMin > chartMin) {
            chartMin = extremes.dataMin;
        }
        if (extremes.dataMax < chartMax) {
            chartMax = extremes.dataMax;
        }
        for (let i = 0; i < this.selectedMathInfo.length; i++) {
            if (this.currentBufferArray[this.selectedMathInfo[i].channel] === undefined || this.currentBufferArray[this.selectedMathInfo[i].channel].y === undefined) {
                this.selectedMathInfo[i].value = '----';
                continue;
            }
            let seriesNum = this.selectedMathInfo[i].channel;
            let minIndex = Math.round((chartMin - this.chart.series[seriesNum].xData[0]) / this.chart.series[seriesNum].options.pointInterval);
            let maxIndex = Math.round((chartMax - this.chart.series[seriesNum].xData[0]) / this.chart.series[seriesNum].options.pointInterval);
            this.selectedMathInfo[i].value = this.updateMathByName(this.selectedMathInfo[i], maxIndex, minIndex);
        }
    
    }

    updateMathByName(selectedMathInfoObj: any, maxIndex: number, minIndex: number) {
        switch (selectedMathInfoObj.measurement) {
            case 'Frequency': 
                return this.getFrequency(selectedMathInfoObj.channel, maxIndex, minIndex);
                
            case 'Pos Pulse Width':
                return 'Pos Pulse Width'
                
            case 'Pos Duty Cycle':
                return 'Pos Duty Cycle'
                
            case 'Period':
                return this.getPeriod(selectedMathInfoObj.channel, maxIndex, minIndex);

            case 'Neg Pulse Width':
                return 'Neg Pulse Width'
                
            case 'Neg Duty Cycle':
                return 'Neg Duty Cycle'
                
            case 'Rise Rate':
                return 'Rise Rate'
                
            case 'Rise Time':
                return 'Rise Time'
                
            case 'Amplitude':
                return this.getAmplitude(selectedMathInfoObj.channel, maxIndex, minIndex);
                
            case 'High':
                return 'High'
                
            case 'Low':
                return 'Low'
                
            case 'Peak to Peak':
                return this.getPeakToPeak(selectedMathInfoObj.channel, maxIndex, minIndex);
                
            case 'Maximum':
                return this.getMax(selectedMathInfoObj.channel, maxIndex, minIndex);
                
            case 'Minimum':
                return this.getMin(selectedMathInfoObj.channel, maxIndex, minIndex);
                
            case 'Mean':
                return this.getMean(selectedMathInfoObj.channel, maxIndex, minIndex);
                
            case 'RMS':
                return this.getRMS(selectedMathInfoObj.channel, maxIndex, minIndex);
                
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

    getMax(seriesNum: number, maxIndex: number, minIndex: number) {
        //Spread operator '...' uses each index as the corresponding parameter in the function
        let activeIndices = this.chart.series[seriesNum].yData.slice(minIndex, maxIndex);
        let value = Math.max(...activeIndices);
        let vPerDiv = Math.abs(this.chart.yAxis[seriesNum].max - this.chart.yAxis[seriesNum].min) / 10;
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

        let val = (value * Math.pow(1000, i)).toString();
        let wholeLength = val.indexOf('.');
        if (wholeLength === -1) { wholeLength = 4 }
        let fixedNum = 4 - wholeLength;

        return (parseFloat(val)).toFixed(fixedNum) + unit;

    }

    getMin(seriesNum: number, maxIndex: number, minIndex: number) {
        let activeIndices = this.chart.series[seriesNum].yData.slice(minIndex, maxIndex);
        let value = Math.min(...activeIndices);
        let vPerDiv = Math.abs(this.chart.yAxis[seriesNum].max - this.chart.yAxis[seriesNum].min) / 10;
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

        let val = (value * Math.pow(1000, i)).toString();
        let wholeLength = val.indexOf('.');
        if (wholeLength === -1) { wholeLength = 4 }
        let fixedNum = 4 - wholeLength;

        return (parseFloat(val)).toFixed(fixedNum) + unit;
    }

    getLocalMax(seriesNum: number, maxIndex: number, minIndex: number) {
        let maxCoordinates = [];
        let detector: boolean = true;
        for (let i = minIndex; i < maxIndex - 1; i++) {
            if (this.chart.series[seriesNum].yData[i] - this.chart.series[seriesNum].yData[i + 1] >= 0 && !detector) {
                maxCoordinates.push({
                    x: this.chart.series[seriesNum].xData[i],
                    y: this.chart.series[seriesNum].yData[i]
                });
                detector = true;
            }
            if (this.chart.series[seriesNum].yData[i] - this.chart.series[seriesNum].yData[i + 1] < 0 && detector) {
                detector = false;
            }
        }
    }

    getLocalMin(seriesNum: number, maxIndex: number, minIndex: number) {
        let minCoordinates = [];
        let detector: boolean = true;
        for (let i = minIndex; i < maxIndex - 1; i++) {
            if (this.chart.series[seriesNum].yData[i] - this.chart.series[seriesNum].yData[i + 1] < 0 && !detector) {
                minCoordinates.push({
                    x: this.chart.series[seriesNum].xData[i],
                    y: this.chart.series[seriesNum].yData[i]
                });
                detector = true;
            }
            if (this.chart.series[seriesNum].yData[i] - this.chart.series[seriesNum].yData[i + 1] >= 0 && detector) {
                detector = false;
            }
        }
    }

    getAmplitude(seriesNum: number, maxIndex: number, minIndex: number) {
        let max = this.getMax(seriesNum, maxIndex, minIndex);
        let min = this.getMin(seriesNum, maxIndex, minIndex);
        let amplitude = (parseFloat(max) - parseFloat(min)) / 2;
        let unit = max.substr(max.indexOf(' '));

        let wholeLength = amplitude.toString().indexOf('.');
        if (wholeLength === -1) { wholeLength = 4 }
        let fixedNum = 4 - wholeLength;

        return (amplitude).toFixed(fixedNum) + unit;
    }

    getMean(seriesNum: number, maxIndex: number, minIndex: number) {
        let sum = 0;
        for (let i = minIndex; i < maxIndex; i++) {
            sum += this.chart.series[seriesNum].yData[i];
        }
        let value = sum / (maxIndex - minIndex);
        let vPerDiv = Math.abs(this.chart.yAxis[seriesNum].max - this.chart.yAxis[seriesNum].min) / 10;
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

        let val = (value * Math.pow(1000, i)).toString();
        let wholeLength = val.indexOf('.');
        if (wholeLength === -1) { wholeLength = 4 }
        let fixedNum = 4 - wholeLength;

        return (parseFloat(val)).toFixed(fixedNum) + unit;
    }

    getRMS(seriesNum: number, maxIndex: number, minIndex: number) {
        let sum = 0;
        for (let i = minIndex; i < maxIndex; i++) {
            sum += Math.pow(this.chart.series[seriesNum].yData[i], 2);
        }
        let value = Math.sqrt(sum / (maxIndex - minIndex));
        let vPerDiv = Math.abs(this.chart.yAxis[seriesNum].max - this.chart.yAxis[seriesNum].min) / 10;
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
        let val = (value * Math.pow(1000, i)).toString();
        let wholeLength = val.indexOf('.');
        if (wholeLength === -1) { wholeLength = 4 }
        let fixedNum = 4 - wholeLength;

        return (parseFloat(val)).toFixed(fixedNum) + unit;
    }

    getPeakToPeak(seriesNum: number, maxIndex: number, minIndex: number) {
        let max = this.getMax(seriesNum, maxIndex, minIndex);
        let min = this.getMin(seriesNum, maxIndex, minIndex);
        let unit = max.substr(max.indexOf(' '));
        let p2p = Math.abs(parseFloat(max)) + Math.abs(parseFloat(min));

        let wholeLength = p2p.toString().indexOf('.');
        if (wholeLength === -1) { wholeLength = 4 }
        let fixedNum = 4 - wholeLength;

        return (p2p).toFixed(fixedNum) + unit;
    }

    getFrequency(seriesNum: number, maxIndex: number, minIndex: number) {
        let value = this.chart.series[seriesNum].yData[minIndex];
        let points = [];
        for (let i = minIndex; i < maxIndex - 1; i++) {
            if (this.chart.series[seriesNum].yData[i] <= value && this.chart.series[seriesNum].yData[i + 1] >= value) {
                points.push(this.chart.series[seriesNum].xData[i]);
                //Increment i twice in case one of the points was equal to the value
                i++;
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

        let val = ((1 / (sum / (points.length - 1))) / Math.pow(1000, i)).toString();
        let wholeLength = val.indexOf('.');
        if (wholeLength === -1) { wholeLength = 4 }
        let fixedNum = 4 - wholeLength;

        return (parseFloat(val)).toFixed(fixedNum) + unit;
    }

    getPeriod(seriesNum: number, maxIndex: number, minIndex: number) {
        let value = this.chart.series[seriesNum].yData[minIndex];
        let points = [];
        for (let i = minIndex; i < maxIndex - 1; i++) {
            if (this.chart.series[seriesNum].yData[i] <= value && this.chart.series[seriesNum].yData[i + 1] >= value) {
                points.push(this.chart.series[seriesNum].xData[i]);
                //Increment i twice in case one of the points was equal to the value
                i++;
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

        let val = ((sum / (points.length - 1)) * Math.pow(1000, i)).toString();
        let wholeLength = val.indexOf('.');
        if (wholeLength === -1) { wholeLength = 4 }
        let fixedNum = 4 - wholeLength;

        return (parseFloat(val)).toFixed(fixedNum) + unit;
    }

    calculateDataFromWindow() {
        //100 points per division
        let numPoints = 1000;
        //Need to sample at 100 times in 1 time division
        let sampleFreq = 100 * (1 / this.secsPerDivVals[this.activeTPDIndex]);

        return {
            bufferSize: numPoints,
            sampleFreq: sampleFreq //Hz since it's converted in the instrument
        };
    }

    removeSeriesAnchor(seriesNum: number) {
        this.seriesAnchors[seriesNum].destroy();
        this.seriesAnchors[seriesNum] = undefined;
    }

    removeTriggerAnchor() {
        this.triggerAnchor.destroy();
        this.triggerAnchor = undefined;
    }

    updateTriggerAnchor(seriesNum: number) {
        if (this.currentBufferArray[seriesNum] === undefined || this.currentBufferArray[seriesNum].triggerPosition === undefined) { return; }
        if (this.triggerAnchor === undefined) {
            this.addTriggerAnchor(seriesNum);
            return;
        }
        let timePostion = this.currentBufferArray[seriesNum].triggerPosition * this.currentBufferArray[seriesNum].dt;
        let xPixel = this.chart.xAxis[0].toPixels(timePostion);
        if (xPixel < this.chart.plotLeft) {
            this.removeTriggerAnchor();
            return;
        }
        this.triggerAnchor.translate(xPixel - 1, this.chart.plotTop - 1);
    }

    addTriggerAnchor(seriesNum: number) {
        if (this.triggerAnchor !== undefined) { return; }
        let position = this.currentBufferArray[seriesNum].triggerPosition;
        if (position < 0) { return; }
        let dt = this.currentBufferArray[seriesNum].dt;
        //TODO add delay in here yo
        let timePosition = position * dt + 0;
        let xPixel = this.chart.xAxis[0].toPixels(timePosition);
        let extremes = this.chart.xAxis[0].getExtremes();
        if (isNaN(xPixel) || timePosition > extremes.max || timePosition < extremes.min) {
            return;
        }
        let path = ['M', 0, 0, 'L', 5, -9, -5, -9, 'Z'];
        this.triggerAnchor = this.chart.renderer.path(path)
            .attr({
                'stroke-width': 1,
                stroke: 'black',
                fill: 'green',
                zIndex: 3,
                id: ('triggerAnchor')
            })
            .add();
        this.triggerAnchor.translate(xPixel - 1, this.chart.plotTop - 1);
    }

    updateTriggerLine() {
        if (this.triggerPlotLine === undefined) {
            this.addTriggerLine(this.numSeries[0]);
            return;
        }
        let trigPosition = this.currentBufferArray[this.numSeries[0]].triggerPosition;
        if (trigPosition < 0) {
            this.triggerPlotLine.destroy();
            this.timelineTriggerPlotLine.destroy();
            this.triggerPlotLine = undefined;
            this.timelineTriggerPlotLine = undefined;
            return;
        }
        let value = trigPosition * this.currentBufferArray[this.numSeries[0]].dt;
        this.triggerPlotLine.options.value = value;
        this.timelineTriggerPlotLine.options.value = value;
        this.triggerPlotLine.render();
        this.timelineTriggerPlotLine.render();
    }

    addTriggerLine(seriesNum) {
        let trigPosition = this.currentBufferArray[seriesNum].triggerPosition;
        if (trigPosition < 0 || trigPosition === undefined) { return; }
        let initialValue = trigPosition * this.currentBufferArray[seriesNum].dt;
        this.triggerPlotLine = this.chart.xAxis[0].addPlotLine({
            value: initialValue,
            color: 'green',
            width: 1,
            zIndex: 3,
            id: 'triggerLine'
        });
        if (this.timelineView) {
            this.timelineTriggerPlotLine = this.timelineChart.xAxis[0].addPlotLine({
                value: initialValue,
                color: 'green',
                width: 1,
                zIndex: 3,
                id: 'triggerLine'
            });
        }
    }

    addSeriesAnchor(seriesNum: number) {
        //convert offset to V from mV
        let offset = this.currentBufferArray[seriesNum].seriesOffset / 1000;
        let color = this.chart.series[seriesNum].color;
        let startingPos = this.chart.yAxis[seriesNum].toPixels(offset);
        let extremes = this.chart.yAxis[seriesNum].getExtremes();
        if (isNaN(startingPos) || offset > extremes.max || offset < extremes.min) {
            return;
        }
        this.yPositionPixels = startingPos;
        if (this.seriesAnchors[seriesNum] !== undefined) {
            this.seriesAnchors[this.activeSeries - 1].attr({
                x: this.chart.plotLeft - 12,
                y: startingPos - 6
            });
            return;
        }
        //TODO try to set attr after render to fix performance problems.
        let path = ['M', 0, 0, 'L', 9, 5, 0, 10, 'Z'];
        this.seriesAnchors[seriesNum] = this.chart.renderer.path(path)
            .attr({
                'stroke-width': 1,
                stroke: 'black',
                fill: color,
                zIndex: 3,
                id: ('seriesAnchor' + (seriesNum).toString())
            })
            .css({
                'cursor': 'pointer'
            })
            .add()
            .on('mousedown', (event) => {
                this.setActiveSeries(seriesNum + 1);
                let offset = this.currentBufferArray[seriesNum].seriesOffset / 1000;
                this.yPositionPixels = this.chart.yAxis[seriesNum].toPixels(offset);
                this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.verticalOffsetListener);
                this.oscopeChartInner.nativeElement.addEventListener('touchmove', this.verticalOffsetListener);
            })
            .on('touchstart', (event) => {
                this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.verticalOffsetListener);
                this.oscopeChartInner.nativeElement.addEventListener('touchmove', this.verticalOffsetListener);
            })
            .on('mouseup', (event) => {
                this.clearMouse();
            })
            .on('touchend', (event) => {
                this.clearMouse();
            });
        this.seriesAnchors[seriesNum].translate(this.chart.plotLeft - 12, startingPos - 6);

    }

    updateSeriesAnchor(seriesNum: number) {
        if (this.oscopeChansActive[seriesNum] === false || this.currentBufferArray[seriesNum] === undefined || this.currentBufferArray[seriesNum].y === undefined) { return; }
        if (this.seriesAnchors[seriesNum] === undefined) {
            this.addSeriesAnchor(seriesNum);
            return;
        }
        else if (this.oscopeChansActive[seriesNum] === false) { return; }
        let offset = this.currentBufferArray[seriesNum].seriesOffset / 1000;
        this.seriesAnchors[seriesNum].translate(this.chart.plotLeft - 12, this.chart.yAxis[seriesNum].toPixels(offset) - 6);
        this.yPositionPixels = this.chart.yAxis[seriesNum].toPixels(offset);
    }

    applyPointOfInterest(seriesNum: number) {
        let poiIndex = this.currentBufferArray[seriesNum].pointOfInterest;
        if (poiIndex < 0 || poiIndex === undefined) {
            return;
        }
        let poi = poiIndex * this.currentBufferArray[seriesNum].dt + 0;
        this.base = poi;
        let min = poi - 5 * this.timeDivision;
        let max = poi + 5 * this.timeDivision;
        this.chart.xAxis[0].setExtremes(min, max, false, false);
        if (this.timelineView) {
            this.updatePlotBands([2, 3], [[this.timelineBounds[0], min], [max, this.timelineBounds[1]]]);
            let val1 = this.timelineChart.xAxis[0].toValue(this.timelineChart.xAxis[0].toPixels(min) - 5);
            let val2 = this.timelineChart.xAxis[0].toValue(this.timelineChart.xAxis[0].toPixels(max) + 5);
            this.updatePlotLines([0, 1], [val1, val2]);
        }
    }
}
