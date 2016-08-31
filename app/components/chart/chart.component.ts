import {Component, Output, Input, EventEmitter, ElementRef, ViewChild} from '@angular/core';
import {CHART_DIRECTIVES} from 'angular2-highcharts';
import {ModalController} from 'ionic-angular';
import {NgClass} from '@angular/common';

//Components
import {TimelineChartComponent} from '../timeline-chart/timeline-chart.component';
import {DeviceComponent} from '../device/device.component';

//Pages
import {ModalCursorPage} from '../../pages/cursor-modal/cursor-modal';
import {MathModalPage} from '../../pages/math-modal/math-modal';

@Component({
    selector: 'silverNeedleChart',
    directives: [CHART_DIRECTIVES, NgClass],
    templateUrl: 'build/components/chart/chart.html',
})
export class SilverNeedleChart {
    @Output() chartLoad: EventEmitter<any> = new EventEmitter();
    @ViewChild('oscopeChartInner') oscopeChartInner: ElementRef;
    private timelineChartInner: ElementRef;
    public chart: Object;
    private timelineChartComponent: TimelineChartComponent;
    public timelineChart: Object = null;
    private options: Object;
    private xPosition: number = 0;
    private xPositionPixels: number = 0;
    private yPositionPixels: number = 0;
    private yPosition: number = 0;
    private numXCursors: number = 0;
    //private cursorLabel: any[];
    private cursorAnchors: any[] = [0, 0, 0, 0];
    private xCursorDragStartPos: any;
    private activeCursor: number = -1;
    private activeSeries: number = 1;
    private numYCursors: number = 0;
    private cursorType: string = 'disabled';
    private cursor1Chan: string = 'O1';
    private cursor2Chan: string = 'O1';
    private cursorsEnabled: boolean = false;
    private canPan: boolean = false;
    private activeTimeLine: number = -1;
    private chartBoundsX: Object = null;
    private chartBoundsY: Object = null;
    private inTimelineDrag: boolean = false;
    private activeChannels = [0, 0];
    private autoscaleAll: boolean = false;
    private mathEnabled: boolean = false;
    private voltsPerDivOpts: string[] = null;
    private voltsPerDivVals: number[] = null;
    private generalVoltsPerDivOpts: string[] = ['1 mV', '2 mV', '5 mv', '10 mV', '20 mV', '50 mV', '100 mV', '200 mV', '500 mV', '1 V', '2 V', '5 V'];
    private activeVPDIndex: number[] = [9, 9];
    private generalVoltsPerDivVals: number[] = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5];

    private secsPerDivOpts: string[] = ['1 ns', '2 ns', '5 ns', '10 ns', '20 ns', '50 ns', '100 ns', '200 ns', '500 ns', '1 us',
            '2 us', '5 us', '10 us', '20 us', '50 us', '100 us', '200 us', '500 us', '1 ms', '2 ms', '5 ms', '10 ms', '20 ms', 
            '50 ms', '100 ms', '200 ms', '500 ms', '1 s', '2 s', '5 s', '10 s'];
    private activeTPDIndex: number = 27;
    private secsPerDivVals: number[] = [0.000000001, 0.000000002, 0.000000005, 0.00000001, 0.00000002, 0.00000005, 0.0000001, 0.0000002,
            0.0000005, 0.000001, 0.000002, 0.000005, 0.00001, 0.00002, 0.00005, 0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01,
            0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];

    private timelineView: boolean = false;
    private timelineBounds: number[] = [0, 0, 0, 0];

    public timeDivision: number = 1;
    public base: number = 0;
    public numSeries: number[] = [0, 1];

    public voltDivision: number[] = [1, 1];
    public voltBase: number[] = [0, 0];

    private cursorPositions: Array<Object> = [{x: null, y: null}, {x: null, y: null}];
    private modalCtrl: ModalController;

    private chartReady: boolean = false;
    private timelineChartReady: boolean = false;
    private timelineChartInitialized: boolean = false;

    private timelineChartEventListener: EventEmitter<any>;

    public autoscaleYaxes: boolean[] = [];
    public autoscaleXaxis: boolean = false;

    constructor(_modalCtrl: ModalController) {
        this.modalCtrl = _modalCtrl;
        this.options = {
            chart: {
                type: 'line',
                zoomType: '',
                animation: false,
                spacingTop: 20
            },
            title: {
                text: ''
            },
            tooltip: {
                enabled: true,
                formatter: function () {
                    let timePerDiv = Math.abs(this.series.xAxis.max - this.series.xAxis.min) / 10;
                    if (parseFloat(this.value) == 0) {
                        return this.value + 's';
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
                    this.x =  this.x + unit;
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
            series: [{
                data: [29.9, 36, 47, 57, 67, 71.5, 82, 92, 102, 106.4, 110, 120, 129.2],
                allowPointSelect: true
            },
            {
                data: [50, 60, 70, 80],
                allowPointSelect: true,
                yAxis: 1
            }
            ],
            legend: {
                enabled: false
            },
            yAxis: [{
                gridLineWidth: 1,
                offset: 0,
                labels: {
                    formatter: function() {
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
                        ticks[i] = (min + i * delta).toFixed(3);
                    }
                    return ticks;
                },
                title: {
                    text: 'Series 1'
                }
            }, {
                gridLineWidth: 1,
                offset: 0,
                labels: {
                    enabled: false,
                    formatter: function () {
                        let vPerDiv = Math.abs(this.chart.yAxis[1].max - this.chart.yAxis[1].min) / 10;
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
                    let min = this.chart.yAxis[1].min;
                    let max = this.chart.yAxis[1].max;
                    let delta = (max - min) / (numTicks - 1);
                    for (var i = 0; i < numTicks; i++) {
                        ticks[i] = (min + i * delta).toFixed(3);
                    }
                    return ticks;
                },
                title: {
                    text: null
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
                    formatter: function() {
                        let timePerDiv = Math.abs(this.chart.xAxis[0].max - this.chart.xAxis[0].min) / 10;
                        if (parseFloat(this.value) == 0) {
                            return this.value + 's';
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
                startOnTick: true,
                endOnTick: true,

                gridLineWidth: 1,
                minorGridLineWidth: 0,

                tickPositioner: function () {
                    let numTicks = 11;
                    let ticks = [];
                    let min = this.chart.xAxis[0].min;
                    let max = this.chart.xAxis[0].max;
                    let delta = (max - min) / (numTicks - 1);
                    let mult = 3;
                    if (delta < .001) {
                        let exp = delta.toExponential(3);
                        let real1 = exp.slice(exp.indexOf('e') - exp.length + 1);
                        mult = -1 * Number(real1) + 3;
                        if (mult > 20) {
                            mult = 20;
                        }
                    }
                    for (var i = 0; i < numTicks; i++) {
                        ticks[i] = (min + i * delta).toFixed(mult); 
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

    loadDeviceSpecificValues(deviceComponent: DeviceComponent) {
        let resolution = (deviceComponent.instruments.osc.chans[0].adcRange / 1000) / Math.pow(2, deviceComponent.instruments.osc.chans[0].effectiveBits);
        let i = 0;
        while (resolution > this.generalVoltsPerDivVals[i] && i < this.generalVoltsPerDivVals.length - 1) {
            i++;
        }
        this.voltsPerDivVals = this.generalVoltsPerDivVals.slice(i);
        this.voltsPerDivOpts = this.generalVoltsPerDivOpts.slice(i);
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
        this.autoscaleAxis('x', 0);
        this.autoscaleAxis('y', 0);
        this.autoscaleAxis('y', 1);
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
    onPointSelect (event) {
        this.activeSeries = event.context.series.index + 1;
        this.updateYAxisLabels();
    }

    //Displays the y axis label for the active series and hide the others
    updateYAxisLabels() {
        for (let i = 0; i < this.chart.yAxis.length; i++) {
            if (i === this.activeSeries - 1) {
                this.chart.yAxis[this.activeSeries - 1].update({
                        labels: {
                            enabled: true
                        },
                        title: {
                            text: 'Series ' + (i + 1)
                        }
                    });
            }
            else {
                this.chart.yAxis[i].update({
                    labels: {
                        enabled: false
                    },
                    title: {
                        text: null
                    } 
                });
            }
        }
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
    }

    //Draws a waveform. If axis does not exist for series number, add new axis and then set data
    drawWaveform(seriesNum: number, waveform: any) {
        if (seriesNum < this.chart.yAxis.length) {
            this.chart.series[seriesNum].setData(waveform.y, false, false, false);
        }
        else {
            this.numSeries.push(seriesNum);
            this.addYAxis(seriesNum);
            let options = {
                data: waveform.y,
                allowPointSelect: true,
                yAxis: seriesNum
            };
            this.chart.addSeries(options, false, false);
            if (this.timelineView) {
                let timelineOptions = {
                    data: waveform.y,
                };
                this.timelineChart.addSeries(timelineOptions, false, false);
            }
        }
        this.chart.series[seriesNum].update({
            pointStart: waveform.t0,
            pointInterval: waveform.dt
        });
        //Update point interval in timeline as well to show where user view is in timeline
        this.chart.redraw(false);
        this.updateCursorLabels();
        if (this.timelineView) {
            this.timelineChart.series[seriesNum].setData(waveform.y, false, false, false);
            this.timelineChart.series[seriesNum].update({
                pointStart: waveform.t0,
                pointInterval: waveform.dt
            });
            this.timelineChart.redraw(false);
            let extremesX = this.timelineChart.xAxis[0].getExtremes();
            let extremesY = this.timelineChart.yAxis[0].getExtremes();
            this.timelineBounds = [extremesX.min, extremesX.max, extremesY.dataMin, extremesY.dataMax];
            //Not sure if needed? The plot lines and bands should be in the same position.
            /*this.chartBoundsX = this.chart.xAxis[0].getExtremes();
            let left = this.chart.xAxis[0].toValue(this.chart.xAxis[0].toPixels(this.chartBoundsX.min) - 5);
            let right = this.chart.xAxis[0].toValue(this.chart.xAxis[0].toPixels(this.chartBoundsX.max) + 5);
            this.updatePlotBands([2, 3], [[extremesX.min, this.chartBoundsX.min], [this.chartBoundsX.max, extremesX.max]]);
            this.updatePlotLines([0, 1], [left, right]);*/
        }
        if (this.autoscaleAll) {
            this.autoscaleAllAxes();
        }
        else {
            if (this.autoscaleXaxis) {
                this.autoscaleAxis('x', 0);
            }
            let i = -1;
            while((i = this.autoscaleYaxes.indexOf(true, i + 1)) >= 0) {
                this.autoscaleAxis('y', i)
            }
        }
    }

    //Remove extra series and axes from the chart
    clearExtraSeries(usedSeries: number[]) {
        this.numSeries = usedSeries;
        if (this.chart.series.length <= usedSeries.length) {
            return;
        }
        let lengthExists = this.chart.series.length;
        for (let i = usedSeries.length; i < lengthExists; i++) {
            this.chart.series[i].remove(false);
            this.chart.yAxis[i].remove(false);
        }
        if (this.timelineView) {
            for (let i = usedSeries.length; i < lengthExists; i++) {
                this.timelineChart.series[i].remove(false);
                this.timelineChart.yAxis[i].remove(false);
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
            if (typeof(this.cursorAnchors[i]) === 'object') {
                //this.cursorLabel[i].destroy();
                this.cursorAnchors[i].destroy();
                this.cursorAnchors[i] = 'empty';
                //this.cursorLabel[i] = 'empty';
            }
        }
        this.numXCursors = 0;
        this.numYCursors = 0;
        this.cursorPositions = [{x: null, y: null}, {x: null, y: null}];
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
                y: this.chart.series[this.activeChannels[0] - 1].data[0].y
            };
            style = 'longdash';
            color = this.chart.series[this.activeChannels[0] - 1].color;
        }
        else {
            initialValue = extremes.max;
            this.activeChannels[1] = parseInt(this.cursor2Chan.slice(-1));
            this.cursorPositions[1] = {
                x: extremes.max,
                y: this.chart.series[this.activeChannels[1] - 1].data[this.chart.series[this.activeChannels[1] - 1].data.length - 1].y
            };
            style = 'dash';
            color = this.chart.series[this.activeChannels[1] - 1].color;
        }
        this.chart.xAxis[0].addPlotLine({
            value: initialValue,
            color: color,
            dashStyle: style,
            width: 3,
            zIndex: 100 + this.numXCursors,
            id: 'cursor' + this.numXCursors,
        });
        if (this.timelineView) {
            this.timelineChart.xAxis[0].addPlotLine({
                value: initialValue,
                color: color,
                dashStyle: style,
                width: 3,
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
                this.activeCursor = parseInt(event.srcElement.id.slice(-1)) + 1;
                this.chartBoundsX = this.chart.xAxis[0].getExtremes();
                this.chartBoundsY = this.chart.yAxis[0].getExtremes();
                this.xCursorDragStartPos = event.clientX;
                this.xCursorStartDrag(this.numXCursors, event.clientX);
            })
            .on('mouseup', (event) => {
                this.activeCursor = -1;
            });
        this.cursorAnchors[this.numXCursors] = this.chart.renderer.rect(this.chart.xAxis[0].toPixels(initialValue) - 5, this.chart.plotTop - 12, 10, 10, 1)
            .attr({
                'stroke-width': 2,
                stroke: 'black',
                fill: 'yellow',
                zIndex: 3,
                id: ('cursorAnchor' + this.numXCursors.toString())
            })
            .css({
                'cursor': 'pointer'
            })
            .add()
            .on('mousedown', (event) => {
                this.activeCursor = parseInt(event.srcElement.id.slice(-1)) + 1;
                this.chartBoundsX = this.chart.xAxis[0].getExtremes();
                this.chartBoundsY = this.chart.yAxis[0].getExtremes();
                this.xCursorDragStartPos = event.clientX;
                this.xCursorStartDrag(this.numXCursors, event.clientX);
            })
            .on('mouseup', (event) => {
                this.activeCursor = -1;
            });

        this.numXCursors++;
    }

    //Add y cursor to the chart and set css properties and event listeners
    addYCursor() {
        let initialValue: number;
        let extremes = this.chart.yAxis[0].getExtremes();
        let style: string = null;
        let color: string = null;
        if (this.numYCursors == 0) {
            initialValue = extremes.min;
            this.activeChannels[0] = parseInt(this.cursor1Chan.slice(-1));
            style = 'longdash';
            color = this.chart.series[this.activeChannels[0] - 1].color;
        }
        else {
            initialValue = extremes.max;
            this.activeChannels[1] = parseInt(this.cursor2Chan.slice(-1));
            style = 'dash';
            color = this.chart.series[this.activeChannels[1] - 1].color;
        }
        this.chart.yAxis[0].addPlotLine({
            value: initialValue,
            color: color,
            dashStyle: style,
            width: 3,
            zIndex: 102 + this.numYCursors,
            id: 'cursor' + (this.numYCursors + 2)
        });
        this.cursorPositions[this.numYCursors].y = initialValue;
        if (this.cursorType !== 'track') {
            if (this.timelineView) {
                this.timelineChart.yAxis[0].addPlotLine({
                    value: initialValue,
                    color: color,
                    dashStyle: style,
                    width: 3,
                    zIndex: 100 + this.numXCursors,
                    id: 'timelineCursor' + (this.numYCursors + 2)
                });
            }
            //this.cursorLabel[this.numYCursors + 2] = this.chart.renderer.text('Cursor ' + (this.numYCursors + 2), 100, 500).add();
            this.cursorAnchors[this.numYCursors + 2] = this.chart.renderer.rect(this.chart.plotLeft - 12, this.chart.yAxis[0].toPixels(initialValue) - 6, 10, 10, 1)
            .attr({
                'stroke-width': 2,
                stroke: 'black',
                fill: 'yellow',
                zIndex: 3,
                id: ('cursorAnchor' + (this.numYCursors + 2).toString())
            })
            .css({
                'cursor': 'pointer'
            })
            .add()
            .on('mousedown', (event) => {
                this.activeCursor = parseInt(event.srcElement.id.slice(-1)) + 1;
                this.chartBoundsX = this.chart.xAxis[0].getExtremes();
                this.chartBoundsY = this.chart.yAxis[0].getExtremes();
                this.yCursorStartDrag(this.numYCursors, event.clientY);
            })
            .on('mouseup', (event) => {
                this.activeCursor = -1;
            });
        }
        this.chart.yAxis[0].plotLinesAndBands[this.numYCursors].svgElem.element.id = 'cursor' + (this.numYCursors + 2);
        this.chart.yAxis[0].plotLinesAndBands[this.numYCursors].svgElem.css({
            'cursor': 'pointer'
        })

            .on('mousedown', (event) => {
                if (this.cursorType !== 'track') {
                    this.activeCursor = parseInt(event.srcElement.id.slice(-1)) + 1;
                    this.yCursorStartDrag(this.numYCursors + 2, event.clientX);
                }
            })
            .on('mouseup', (event) => {
                this.activeCursor = -1;
            });

        this.numYCursors++;
    }
    
    //Called on x cursor mousedown. Add correct mousemove listener and mouseup listener
    xCursorStartDrag(cursorId, xStartPos) {
        if (this.cursorType === 'track') {
            this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.trackCursorDragListener);
        }
        else {
            this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.cursorDragListener);
        }
        this.oscopeChartInner.nativeElement.addEventListener('mouseup', this.xCursorStopDrag.bind(this));
    }

    //Called on y cursor mousedown. Add mousemove and mouseup listeners
    yCursorStartDrag(cursorId, xStartPos) {
        this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.yCursorDragListener);
        this.oscopeChartInner.nativeElement.addEventListener('mouseup', this.yCursorStopDrag.bind(this));
    }

    //Called on x cursor mouseup. Remove correct mousemove event listener
    xCursorStopDrag() {
        if (this.cursorType === 'track') {
            this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.trackCursorDragListener);
        }
        else {
            this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.cursorDragListener);
        }
    }

    //Called on y cursor mouseup. Remove mousemove event listener
    yCursorStopDrag() {
        this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.yCursorDragListener);
    }

    //Callback function for mousemove event on a track cursor style
    trackCursorDragListener = function (event) {
        let offset = 110;  
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
        let pointNum1 = pointNum;
        let pointNum2 = pointNum;
        this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value = this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].data[pointNum1].x;
        this.chart.yAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value = this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].data[pointNum1].y;
        if (this.timelineView) {
            this.timelineChart.xAxis[0].plotLinesAndBands[this.activeCursor + 3].options.value = this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].data[pointNum1].x;
            this.timelineChart.xAxis[0].plotLinesAndBands[this.activeCursor + 3].render();
        }
        
        this.cursorPositions[this.activeCursor - 1] = {
            x: parseFloat(this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].data[pointNum].x),
            y: this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].data[pointNum].y
        };
        this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].render();
        this.chart.yAxis[0].plotLinesAndBands[this.activeCursor - 1].render();
        /*this.cursorLabel[this.activeCursor - 1].attr({
            text: 'Series 1: ' + this.chart.series[0].data[pointNum1].y.toFixed(3) + 'V', 
            x: this.chart.xAxis[0].translate(this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value, false) + offset,
            y: yCor,
            zIndex: 99 + this.activeCursor
        });*/
        this.cursorAnchors[this.activeCursor - 1].attr({
            x: this.chart.xAxis[0].translate(this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value, false) + this.chart.plotLeft - 6,
            y: this.chart.plotTop - 12,
            width: 10,
            height: 10,
            'stroke-width': 2,
            stroke: 'black',
            fill: 'yellow',
            zIndex: 3,
        });
    }.bind(this);

    //Callback function for mousemove event on a voltage cursor style
    yCursorDragListener = function (event) {
        //SOME WEIRD Y PIXEL OFFSET SO NEED TO CORRECT BY CALCULATING YDELTA AND ADDING THAT TO YVAL CALCULATION
        let yDelta = event.layerY - (this.chart.yAxis[0].toPixels(parseFloat(this.chart.yAxis[0].toValue(event.chartY - this.chart.plotTop))));
        let yVal = parseFloat(this.chart.yAxis[0].toValue(event.chartY - this.chart.plotTop + yDelta)).toFixed(3);
        let xCor = event.layerX;
        let yCor = event.layerY;
        if (event.chartY === undefined) {
            return;
        }
        if (yVal > this.chart.yAxis[0].dataMax) {
            yVal = this.chart.yAxis[0].dataMax;
            yCor = this.chart.yAxis[0].toPixels(yVal);
        }
        else if (yVal < this.chart.yAxis[0].dataMin) {
            yVal = this.chart.yAxis[0].dataMin;
            yCor = this.chart.yAxis[0].toPixels(yVal);
        }
        if (xCor > this.chart.xAxis[0].toPixels(this.chart.xAxis[0].dataMax)) {
            xCor = this.chart.xAxis[0].toPixels(this.chart.xAxis[0].dataMax) - 50;
        }
        else if (xCor < this.chart.xAxis[0].toPixels(this.chart.xAxis[0].dataMin)) {
            xCor = this.chart.xAxis[0].toPixels(this.chart.xAxis[0].dataMin);
        }
        if (yCor > this.chart.yAxis[0].toPixels(this.chart.yAxis[0].min)) {
            yCor = this.chart.yAxis[0].toPixels(this.chart.yAxis[0].min);
        }

        this.chart.yAxis[0].plotLinesAndBands[this.activeCursor - 3].options.value = yVal;
        if (this.timelineView) {
            this.timelineChart.yAxis[0].plotLinesAndBands[this.activeCursor - 3].options.value = yVal;
            this.timelineChart.yAxis[0].plotLinesAndBands[this.activeCursor - 3].render();
        }
        this.cursorPositions[this.activeCursor - 3] = {
            y: parseFloat(yVal)
        }
        this.chart.yAxis[0].plotLinesAndBands[this.activeCursor - 3].render();
        /*this.cursorLabel[this.activeCursor - 1].attr({
            text: yVal + 'V', 
            x: xCor,
            y: yCor - 10,
            zIndex: 99 + this.activeCursor
        });*/
        this.cursorAnchors[this.activeCursor - 1].attr({
            x: this.chart.plotLeft - 12,
            y: yCor - 6,
            width: 10,
            height: 10,
            'stroke-width': 2,
            stroke: 'black',
            fill: 'yellow',
            zIndex: 3,
        });
    }.bind(this);

    //Callback function for mousemove event on a time cursor style
    cursorDragListener = function (event) {
        let offset = 110;  
        let yCor = event.layerY;
        let xCor = event.layerX;
        if (xCor < this.chart.xAxis[0].toPixels(this.chartBoundsX.min)) {
            xCor = this.chart.xAxis[0].toPixels(this.chartBoundsX.min);
        }
        else if (xCor > this.chart.xAxis[0].toPixels(this.chartBoundsX.max)) {
            xCor = this.chart.xAxis[0].toPixels(this.chartBoundsX.max);
        }
        if (yCor > this.chart.yAxis[0].toPixels(this.chartBoundsY.min)) {
            yCor = this.chart.yAxis[0].toPixels(this.chartBoundsY.min);
        }
        else if (yCor < this.chart.yAxis[0].toPixels(this.chartBoundsY.max)) {
            yCor = this.chart.yAxis[0].toPixels(this.chartBoundsY.max);
        }

        let xVal = this.chart.xAxis[0].translate(xCor - this.chart.plotLeft, true); 
        let pointNum = Math.round((xVal - this.chart.series[0].xData[0]) / this.chart.series[0].options.pointInterval);
        let pointNum1 = pointNum;
        let pointNum2 = pointNum;
        if (this.chart.series[1] !== undefined && pointNum > this.chart.series[1].yData.length - 1) {
            pointNum2 = this.chart.series[1].yData.length - 1;
        }
        this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value = xVal;
        if (this.timelineView) {
            this.timelineChart.xAxis[0].plotLinesAndBands[this.activeCursor + 3].options.value = xVal;
            this.timelineChart.xAxis[0].plotLinesAndBands[this.activeCursor + 3].render();
        }
        this.cursorPositions[this.activeCursor - 1] = {
            x: parseFloat(xVal),
            y: this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].data[pointNum1].y
        }
        this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].render();
        /*this.cursorLabel[this.activeCursor - 1].attr({
            text: 'Series 1: ' + this.chart.series[0].data[pointNum1].y + 'V',
            x: this.chart.xAxis[0].translate(this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value, false) + offset,
            y: yCor,
            zIndex: 99 + this.activeCursor
        });*/
        this.cursorAnchors[this.activeCursor - 1].attr({
            x: xCor - 6,
            y: this.chart.plotTop - 12,
            width: 10,
            height: 10,
            'stroke-width': 2,
            stroke: 'black',
            fill: 'yellow',
            zIndex: 3,
        });
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



        
        let yDelta = Math.abs(this.cursorPositions[1].y - this.cursorPositions[0].y);
        
    }

    //Exports series data from chart to a csv on client side
    exportCsv(fileName: string) {
        if (this.chart.series.length == 0) {return;}
        fileName = fileName + '.csv';
        let csvContent = 'data:text/csv;charset=utf-8,';
        let pointsArray = [];
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
            cursor2Chan: this.cursor2Chan
        });
        modal.onDidDismiss(data=> {
            if (data.save) {
                this.cursorType = data.cursorType;
                this.cursor1Chan = data.cursor1Chan;
                this.cursor2Chan = data.cursor2Chan;
                this.handleCursors();
            }
        });
        modal.present();
    }

    openMathModal() {
        let modal = this.modalCtrl.create(MathModalPage, {
            chart: this.chart
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
        //Wait for ngClass to apply css class and reflow chart to fill correctly. 
        //TODO check for ngclass event that fires on class change.
        setTimeout(() => {
            this.chart.reflow();
        }, 100);
    }

    //Called on chart mousedown. Sets either vertical or horizontal pan listener
    onChartClick(event) {
        //check cursors enabled to see if the chart is 'interactive'. Added to remove pan from fgen config modal
        if (event.srcElement.localName === 'rect' && this.oscopeChartInner !== undefined && event.srcElement.id === '' && this.cursorsEnabled) {
            this.canPan = true;
            this.xPositionPixels = event.chartX;
            this.yPositionPixels = event.chartY;
            if (event.shiftKey) {
                this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.verticalOffsetListener);
            }
            else {
                this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.panListener);
            }
        }
    }

    //Called on chart mouseup. Removes pan listeners
    clearMouse() {
        this.canPan = false;
        if (this.oscopeChartInner !== undefined) {
            this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.panListener);
            this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.verticalOffsetListener);
            if (this.timelineView && this.timelineChartInner !== undefined) {
                this.timelineChartInner.nativeElement.removeEventListener('mousemove', this.timelineWhiteDragListener);
                this.timelineChartInner.nativeElement.removeEventListener('mousemove', this.timelineDragListener);
                this.inTimelineDrag = false;
            }
        }
    }

    //Callback function for panning
    panListener = function(event) {
        let newVal = this.chart.xAxis[0].toValue(event.chartX);
        let oldValinNewWindow = this.chart.xAxis[0].toValue(this.xPositionPixels);
        let difference = newVal - oldValinNewWindow;
        this.setXExtremes(difference);
        this.updateCursorLabels();
        this.xPositionPixels = event.chartX;
    }.bind(this);

    //Callback function for vertical panning of a series
    verticalOffsetListener = function(event) {
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
        this.chart.yAxis[seriesSettings.seriesNum].setExtremes(min, max);
        this.updateCursorLabels();
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
                    this.cursorAnchors[i].attr({
                        x: this.chart.xAxis[0].toPixels(this.chart.xAxis[0].plotLinesAndBands[i].options.value) - 6
                    });
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
                    this.cursorAnchors[i].attr({
                        y: this.chart.yAxis[0].toPixels(this.chart.yAxis[0].plotLinesAndBands[i - 2].options.value) - 6,
                        x: this.chart.plotLeft - 12
                    });
                //}
            }
        }

        else {
            console.log('error updating cursor labels');
        }
        
    }

    //Set time settings (base and time/div) from an object containing the base and timeDivision
    setTimeSettings(timeObj: any) {
        this.timeDivision = parseFloat(timeObj.timePerDiv);
        this.base = parseFloat(timeObj.base);
        let min = this.base - (this.timeDivision * 5);
        let max = this.base + (this.timeDivision * 5);
        this.chart.xAxis[0].setExtremes(min, max, true, false);
        if (this.timelineView) {
            this.updatePlotBands([2, 3], [[this.timelineBounds[0], min], [max, this.timelineBounds[1]]]);
            let val1 = this.timelineChart.xAxis[0].toValue(this.timelineChart.xAxis[0].toPixels(min) - 5);
            let val2 = this.timelineChart.xAxis[0].toValue(this.timelineChart.xAxis[0].toPixels(max) + 5);
            this.updatePlotLines([0, 1], [val1, val2]);
        }
        this.updateCursorLabels();
    }

    //Set series settings based on an object containing the series number, volts per division, and base
    setSeriesSettings(seriesSettings: any) {
        this.voltDivision[seriesSettings.seriesNum] = seriesSettings.voltsPerDiv;
        this.voltBase[seriesSettings.seriesNum] = seriesSettings.voltBase;
        this.setYExtremes(seriesSettings);
    }

    //Set active series and update labels
    setActiveSeries(seriesNum: number) {
        this.activeSeries = seriesNum;
        this.updateYAxisLabels();
        this.updateCursorLabels();
    }

    //Add y axis to chart and initialize with correct settings
    addYAxis(axisNum: number) {
        if (this.chart.yAxis.length !== axisNum) {
            return;
        }
        let options = {
            gridLineWidth: 1,
            offset: 0,
            labels: {
                enabled: false,
                format: '{value:.3f}'
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

    //Called to toggle autoscaling all axes on or off
    toggleAutoscale() {
        this.autoscaleAll = !this.autoscaleAll;
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
            });
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
        }
        else {
            console.log('invalid axis');
        }
        this.updateCursorLabels();
    }

    //Enables timeline view. Called when chart is initialized
    enableTimelineView() {
        this.timelineView = true;
        setTimeout(() => {
            this.chart.reflow();
            this.timelineChart.reflow();
        }, 200);
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
        }
        else if (!this.inTimelineDrag) {
            let oldValinNewWindow = this.base;
            let difference = oldValinNewWindow - value;
            this.setXExtremes(difference);
            this.updateCursorLabels();
            this.xPositionPixels = event.chartX;
            this.timelineChartInner.nativeElement.addEventListener('mousemove', this.timelineWhiteDragListener);
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
                    .on('mouseup', (event) => {
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
        this.activeTimeLine = lineNum;
        this.chartBoundsX = this.chart.xAxis[0].getExtremes();
    }

    //Called on plot line mouseup and removes mousemove event listener
    clearDragListener(lineNum: number) {
        this.timelineChartInner.nativeElement.removeEventListener('mousemove', this.timelineDragListener);
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
            if (event.chartX > this.timelineChart.xAxis[0].toPixels(this.timelineChart.xAxis[0].plotLinesAndBands[3].options.from)){
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
            if (event.chartX < this.timelineChart.xAxis[0].toPixels(this.timelineChart.xAxis[0].plotLinesAndBands[2].options.to)){
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
    }.bind(this);

    //Callback for timeline plot mousemove events to pan user view of chart
    timelineWhiteDragListener = function(event) {
        let newVal = this.timelineChart.xAxis[0].toValue(event.chartX);
        let oldValinNewWindow = this.timelineChart.xAxis[0].toValue(this.xPositionPixels);
        let difference = oldValinNewWindow - newVal;
        this.setXExtremes(difference);
        this.updateCursorLabels();
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
        });
    }

    incrementTPD(seriesNum) {
        if (this.activeTPDIndex > this.secsPerDivOpts.length - 2) {
            return;
        }
        this.activeTPDIndex++;
        this.setTimeSettings({
            timePerDiv: this.secsPerDivVals[this.activeTPDIndex],
            base: this.base
        });
    }

    incrementBase() {
        this.base = this.base + this.timeDivision;
        this.setTimeSettings({
            timePerDiv: this.timeDivision,
            base: this.base
        });
    }

    decrementBase() {
        this.base = this.base - this.timeDivision;
        this.setTimeSettings({
            timePerDiv: this.timeDivision,
            base: this.base
        }); 
    }

    toggleVisibility(seriesNum: number) {
        this.chart.series[seriesNum].setVisible(!this.chart.series[seriesNum].visible);
    }

    getSeriesVisibility(seriesNum: number) {
        return this.chart.series[seriesNum].visible;
    }

    getSeriesColor(seriesNum: number) {
        return this.chart.series[seriesNum].color;
    }

    toggleAxisAutoscale(axis: string, seriesNum: number) {
        if (axis === 'x') {
            this.autoscaleXaxis  = !this.autoscaleXaxis;
        }
        else if (axis === 'y') {
            this.autoscaleYaxes[seriesNum] = !this.autoscaleYaxes[seriesNum];
        }
        
    }

}
