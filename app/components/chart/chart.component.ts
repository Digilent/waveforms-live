import {Component, Output, Input, EventEmitter, ElementRef, ViewChild} from '@angular/core';
import {CHART_DIRECTIVES} from 'angular2-highcharts';
import {ModalController} from 'ionic-angular';
import {NgClass} from '@angular/common';

//Components
import {TimelineChartComponent} from '../timeline-chart/timeline-chart.component';

//Pages
import {ModalCursorPage} from '../../pages/cursor-modal/cursor-modal';

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
    private timelineOptions: Object;
    private options: Object;
    private xPosition: number;
    private xPositionPixels: number;
    private yPositionPixels: number;
    private yPosition: number;
    private numXCursors: number;
    private cursorLabel: any[];
    private cursorAnchors: any[] = [0, 0, 0, 0];
    private xCursorDragStartPos: any;
    private activeCursor: number;
    private activeSeries: number;
    private numYCursors: number;
    private cursorType: string;
    private cursor1Chan: string;
    private cursor2Chan: string;
    private cursorsEnabled: boolean;
    private canPan: boolean;
    private activeTimeLine: number;
    private chartBoundsX: Object = null;
    private chartBoundsY: Object = null;
    private inTimelineDrag: boolean = false;
    private activeChannels = [0, 0];
    private autoscaleAll: boolean = false;

    private voltsPerDivOpts: string[] = [];
    private activeVPDIndex: number[] = [];
    private voltsPerDivVals: number[] = [];

    private secsPerDivOpts: string[] = [];
    private activeTPDIndex: number = null;
    private secsPerDivVals: number[] = [];

    private timelineView: boolean = false;
    private timelineBounds: number[] = [0, 0, 0, 0];

    public timeDivision: number = 1;
    public base: number = 0;
    public numSeries: number[] = [0, 1];

    public voltDivision: number[] = [1, 1];
    public voltBase: number[] = [0, 0];

    //[x1, series 0 y1, series 1 y1, x2, series 0 y2, series 1 y2]
    private xCursorPositions: number[];
    //[y1, y2]
    private yCursorPositions: number[];

    public voltageMultipliers: string[] = ['V', 'V'];
    public multipliers: string[] = ['mV', 'V'];
    private modalCtrl: ModalController;

    private chartReady: boolean = false;
    private timelineChartReady: boolean = false;
    private timelineChartInitialized: boolean = false;

    private timelineChartEventListener: EventEmitter<any>;

    public autoscaleYaxes: boolean[] = [];
    private autoscaleXaxis: boolean = false;

    constructor(_modalCtrl: ModalController) {
        this.modalCtrl = _modalCtrl;
        this.activeTimeLine = -1;
        this.timeDivision = 3;
        this.base = 12;
        this.canPan = false;
        this.cursorsEnabled = false;
        this.timelineView = false;
        this.cursorType = 'disabled';
        this.cursor1Chan = 'O1';
        this.cursor2Chan = 'O1';
        this.xCursorPositions = [0, 0, 0, 0, 0, 0];
        this.yCursorPositions = [0, 0];
        this.activeSeries = 1;
        this.cursorLabel = ['hey','yo','sup','son'];
        this.activeCursor = -1;
        this.xPosition = 0;
        this.yPosition = 0;
        this.numXCursors = 0;
        this.numYCursors = 0;
        this.options = {
            chart: {
                type: 'line',
                zoomType: '',
                animation: false
            },
            title: {
                text: ''
            },
            tooltip: {
                enabled: true
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
                    format: '{value:.3f}'
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
                    text: 'Series 0'
                }
            }, {
                gridLineWidth: 1,
                offset: 0,
                labels: {
                    enabled: false,
                    format: '{value:.3f}'
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
                labels: {
                    events: {
                        click: function() {
                            console.log('hi');
                        }
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

    ngOnDestroy() {
        this.timelineChartEventListener.unsubscribe();
    }  
    //Called once on chart load
    onLoad(chartInstance) {
        //Save a reference to the chart object so we can call methods on it later
        this.chart = chartInstance;
        
        //Redraw chart to scale chart to container size
        this.redrawChart();
        this.chartLoad.emit(this.chart);
        this.chartReady = true;
        if (this.timelineChartReady === true && this.timelineChartInitialized === false) {
            this.timelineChartInit();
        }
        
        //Generate v/div options. Eventually move to device manager?
        this.voltsPerDivOpts = ['1 mV', '10 mV', '20 mV', '50 mV', '100 mV', '200 mV', '500 mV', '1 V', '2 V', '5 V'];
        this.activeVPDIndex = [7, 7];
        this.voltsPerDivVals = [0.001, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5];
        this.secsPerDivOpts = ['1 ns', '2 ns', '5 ns', '10 ns', '20 ns', '50 ns', '100 ns', '200 ns', '500 ns', '1 us',
            '2 us', '5 us', '10 us', '20 us', '50 us', '100 us', '200 us', '500 us', '1 ms', '2 ms', '5 ms', '10 ms', '20 ms', 
            '50 ms', '100 ms', '200 ms', '500 ms', '1 s', '2 s', '5 s', '10 s'];
        this.secsPerDivVals = [0.000000001, 0.000000002, 0.000000005, 0.00000001, 0.00000002, 0.00000005, 0.0000001, 0.0000002,
            0.0000005, 0.000001, 0.000002, 0.000005, 0.00001, 0.00002, 0.00005, 0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01,
            0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
        this.activeTPDIndex = 27;
    }

    //Called on timeline chart load
    onTimelineLoad(chartInstance) {
        this.timelineChart = chartInstance.chart;
        this.timelineChartComponent = chartInstance;
        this.timelineChartInner = chartInstance.timelineChartInner;
        this.timelineChartReady = true;
        if (this.chartReady === true && this.timelineChartInitialized === false) {
            this.timelineChartInit();
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
        this.timelineChart.reflow();
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
                            text: 'Series ' + i
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
            this.updateCursorLabels();
        }
        else if (this.chart != undefined) {
            this.chart.reflow();
            this.updateCursorLabels();
        }
    }

    //Draws a waveform. If axis does not exist for series number, add new axis and then set data
    drawWaveform(seriesNum: number, waveform: any) {
        if (seriesNum < this.chart.yAxis.length) {
            this.chart.series[seriesNum].setData(waveform.y, true, false, false);
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
            this.timelineChart.series[seriesNum].setData(waveform.y, true, false, false);
            this.timelineChart.series[seriesNum].update({
                pointStart: waveform.t0,
                pointInterval: waveform.dt
            });
            this.timelineChart.redraw();
            let extremesX = this.timelineChart.xAxis[0].getExtremes();
            let extremesY = this.timelineChart.yAxis[0].getExtremes();
            this.timelineBounds = [extremesX.min, extremesX.max, extremesY.dataMin, extremesY.dataMax];
            this.chartBoundsX = this.chart.xAxis[0].getExtremes();
            let left = this.chart.xAxis[0].toValue(this.chart.xAxis[0].toPixels(this.chartBoundsX.min) - 5);
            let right = this.chart.xAxis[0].toValue(this.chart.xAxis[0].toPixels(this.chartBoundsX.max) + 5);
            this.updatePlotBands([2, 3], [[extremesX.min, this.chartBoundsX.min], [this.chartBoundsX.max, extremesX.max]]);
            this.updatePlotLines([0, 1], [left, right]);
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
        for (let i = 0; i < this.cursorLabel.length; i++) {
            if (typeof(this.cursorLabel[i]) === 'object') {
                this.cursorLabel[i].destroy();
                this.cursorAnchors[i].destroy();
                this.cursorAnchors[i] = 'empty';
                this.cursorLabel[i] = 'empty';
            }
        }
        this.numXCursors = 0;
        this.numYCursors = 0;
        this.xCursorPositions = [0, 0, 0, 0, 0, 0];
        this.yCursorPositions = [0, 0];
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
            this.xCursorPositions[3 * this.numXCursors] = extremes.min;
            this.xCursorPositions[3 * this.numXCursors + 1] = this.chart.series[0].data[0].y;
            this.xCursorPositions[3 * this.numXCursors + 2] = this.chart.series[1].data[0].y;
            style = 'longdash';
            color = this.chart.series[this.activeChannels[0] - 1].color;
        }
        else {
            initialValue = extremes.max;
            this.activeChannels[1] = parseInt(this.cursor2Chan.slice(-1));
            this.xCursorPositions[3 * this.numXCursors] = extremes.max;
            this.xCursorPositions[3 * this.numXCursors + 1] = this.chart.series[0].data[this.chart.series[0].data.length - 1].y;
            this.xCursorPositions[3 * this.numXCursors + 2] = this.chart.series[1].data[this.chart.series[1].data.length - 1].y;
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
        this.cursorLabel[this.numXCursors] = this.chart.renderer.text('Cursor ' + this.numXCursors, 100, 100).add();
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
        this.yCursorPositions[this.numYCursors] = initialValue;
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
            this.cursorLabel[this.numYCursors + 2] = this.chart.renderer.text('Cursor ' + (this.numYCursors + 2), 100, 500).add();
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
        this.chart.options.chart.events.click = function (event) {
            console.log('chart click');
        };
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
        let xVal = this.chart.xAxis[0].translate(xCor - this.chart.plotLeft, true).toFixed(3); 
        let pointNum = Math.round((xVal - this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].xData[0]) / this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].pointInterval);
        let pointNum1 = pointNum;
        let pointNum2 = pointNum;
        if (pointNum > this.chart.series[1].xData.length - 1) {
            pointNum2 = this.chart.series[1].xData.length - 1;
        }
        this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value = this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].data[pointNum1].x;
        this.chart.yAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value = this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].data[pointNum1].y;
        if (this.timelineView) {
            this.timelineChart.xAxis[0].plotLinesAndBands[this.activeCursor + 3].options.value = this.chart.series[this.activeChannels[this.activeCursor - 1] - 1].data[pointNum1].x;
            this.timelineChart.xAxis[0].plotLinesAndBands[this.activeCursor + 3].render();
        }
        this.xCursorPositions[3 * this.activeCursor - 3] = parseFloat(this.chart.series[0].data[pointNum1].x);
        this.xCursorPositions[3 * this.activeCursor - 2] = this.chart.series[0].data[pointNum1].y;
        this.xCursorPositions[3 * this.activeCursor - 1] = this.chart.series[1].data[pointNum2].y;
        this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].render();
        this.chart.yAxis[0].plotLinesAndBands[this.activeCursor - 1].render();
        this.cursorLabel[this.activeCursor - 1].attr({
            text: 'Series 1: ' + this.chart.series[0].data[pointNum1].y.toFixed(3) + 'V' + 
            '<br>Series 2: ' + this.chart.series[1].data[pointNum2].y.toFixed(3) + 'V', 
            x: this.chart.xAxis[0].translate(this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value, false) + offset,
            y: yCor,
            zIndex: 99 + this.activeCursor
        });
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
        if (yVal < this.chart.yAxis[0].dataMin) {
            yVal = this.chart.yAxis[0].dataMin;
            yCor = this.chart.yAxis[0].toPixels(yVal);
        }
        if (xCor > this.chart.xAxis[0].toPixels(this.chart.xAxis[0].dataMax)) {
            xCor = this.chart.xAxis[0].toPixels(this.chart.xAxis[0].dataMax) - 50;
        }
        if (xCor < this.chart.xAxis[0].toPixels(this.chart.xAxis[0].dataMin)) {
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
        this.yCursorPositions[this.activeCursor - 3] = parseFloat(yVal);
        this.chart.yAxis[0].plotLinesAndBands[this.activeCursor - 3].render();
        this.cursorLabel[this.activeCursor - 1].attr({
            text: yVal + 'V', 
            x: xCor,
            y: yCor - 10,
            zIndex: 99 + this.activeCursor
        });
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
        let pointNum = Math.round((xVal - this.chart.series[0].xData[0]) / this.chart.series[0].pointInterval);
        let pointNum1 = pointNum;
        let pointNum2 = pointNum;
        if (pointNum > this.chart.series[1].yData.length - 1) {
            pointNum2 = this.chart.series[1].yData.length - 1;
        }
        this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value = xVal;
        if (this.timelineView) {
            this.timelineChart.xAxis[0].plotLinesAndBands[this.activeCursor + 3].options.value = xVal;
            this.timelineChart.xAxis[0].plotLinesAndBands[this.activeCursor + 3].render();
        }
        this.xCursorPositions[3 * this.activeCursor - 3] = parseFloat(xVal);
        this.xCursorPositions[3 * this.activeCursor - 2] = this.chart.series[0].data[pointNum1].y;
        this.xCursorPositions[3 * this.activeCursor - 1] = this.chart.series[1].data[pointNum2].y;
        this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].render();
        this.cursorLabel[this.activeCursor - 1].attr({
            text: 'Series 1: ' + this.chart.series[0].data[pointNum1].y.toFixed(3) + 'V' + 
            '<br>Series 2: ' + this.chart.series[1].data[pointNum2].y.toFixed(3) + 'V', 
            x: this.chart.xAxis[0].translate(this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value, false) + offset,
            y: yCor,
            zIndex: 99 + this.activeCursor
        });
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
    getCursorDeltas() {
        //[xdeltas, series 0 ydeltas on x cursors, series 1 ydeltas on x cursors, ydeltas on y cursors]
        let xDelta = Math.abs(this.xCursorPositions[3] - this.xCursorPositions[0]);
        let xDeltaSer0Y = Math.abs(this.xCursorPositions[4] - this.xCursorPositions[1]);
        let xDeltaSer1Y = Math.abs(this.xCursorPositions[5] - this.xCursorPositions[2]);
        let yDelta = Math.abs(this.yCursorPositions[1] - this.yCursorPositions[0]);
        return [xDelta, xDeltaSer0Y, xDeltaSer1Y, yDelta];
    }

    //Exports series data from chart to a csv on client side
    exportCsv(fileName: string) {
        fileName = fileName + '.csv';
        let csvContent = 'data:text/csv;charset=utf-8,';
        let series1Points = [];
        let series2Points = [];
        let seriesPointsArray = [series1Points, series2Points];
        let timePoints = [];
        let maxLength = 0;
        for (let i = 0; i < this.chart.series.length; i++) {
            if (this.chart.series[i].data.length > maxLength) {
                for (let j = 0; j < this.chart.series[i].data.length; j++) {
                    (seriesPointsArray[i])[j] = this.chart.series[i].data[j].y;
                    timePoints[j] = j * this.chart.options.plotOptions.series.pointInterval;
                }
            }
            else {
                for (let j = 0; j < this.chart.series[i].data.length; j++) {
                    (seriesPointsArray[i])[j] = this.chart.series[i].data[j].y;
                }
            }
        }
        csvContent = csvContent + (timePoints.join()) + '\n' + (series2Points.join()) + '\n' + (series1Points.join());
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
            this.attachPlotLineEvents();
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
                if (typeof(this.cursorLabel[i]) === 'object') {
                    this.cursorLabel[i].attr({
                        x: this.chart.xAxis[0].toPixels(this.chart.xAxis[0].plotLinesAndBands[i].options.value),
                    });
                    this.cursorAnchors[i].attr({
                        x: this.chart.xAxis[0].toPixels(this.chart.xAxis[0].plotLinesAndBands[i].options.value) - 6
                    });
                }
            }
        }

        else if (this.cursorType === 'voltage') {
            for (let i = 2; i < 4; i++) {
                //let pointNum = Math.round((this.chart.xAxis[0].plotLinesAndBands[i].options.value - this.chart.xAxis[0].plotLinesAndBands[i].axis.dataMin) / this.chart.series[0].pointInterval);
                if (typeof(this.cursorLabel[i]) === 'object') {
                    this.cursorLabel[i].attr({
                        y: this.chart.yAxis[0].toPixels(this.chart.yAxis[0].plotLinesAndBands[i - 2].options.value),
                    });
                    this.cursorAnchors[i].attr({
                        y: this.chart.yAxis[0].toPixels(this.chart.yAxis[0].plotLinesAndBands[i - 2].options.value) - 6,
                        x: this.chart.plotLeft - 12
                    });
                }
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
            this.attachPlotLineEvents();
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
            this.base = parseFloat(((this.chart.xAxis[0].dataMax + this.chart.xAxis[0].dataMin) / 2).toFixed(3));
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
            this.voltBase[axisIndex] = parseFloat(((this.chart.yAxis[axisIndex].dataMax + this.chart.yAxis[axisIndex].dataMin) / 2).toFixed(3));
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
            //Seconds per division have changed
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
        this.base = ((newExtremes.min + newExtremes.max) / 2).toFixed(3);
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

    //Changes voltage multiplier for series and updates data to new units
    changeMultiplier(seriesNum: number, multiplier: string, previousSetting: string) {
        if (multiplier === previousSetting) {
            return;
        }
        if (multiplier === 'mV') {
            let newValArray = [];
            this.chart.series[seriesNum].yData.forEach((element, index, array) => {
                newValArray[index] = parseFloat(element) * 1000;
            });
            this.chart.series[seriesNum].setData(newValArray, true, false, false);
            this.chart.redraw(false);
        }
        else if (multiplier === 'V') {
            let newValArray = [];
            this.chart.series[seriesNum].yData.forEach((element, index, array) => {
                newValArray[index] = parseFloat(element) / 1000;
            });
            this.chart.series[seriesNum].setData(newValArray, true, false, false);
            this.chart.redraw(false);
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

    incrementBase(seriesNum) {
        this.base = this.base + this.timeDivision;
        this.setSeriesSettings({
            voltsPerDiv: this.timeDivision,
            voltBase: this.base
        });
    }

    decrementBase(seriesNum) {
        this.voltBase[seriesNum] = this.base - this.timeDivision;
        this.setSeriesSettings({
            voltsPerDiv: this.timeDivision,
            voltBase: this.base
        }); 
    }

    toggleVisibility(seriesNum: number) {
        this.chart.series[seriesNum].setVisible(!this.chart.series[seriesNum].visible);
    }

}
