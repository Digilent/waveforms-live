import {Component, Output, Input, EventEmitter, ElementRef} from '@angular/core';
import {CHART_DIRECTIVES} from 'angular2-highcharts';
import {NavController, Modal} from 'ionic-angular';
import {NgClass} from '@angular/common';

//Pages
import {ModalCursorPage} from '../../pages/cursor-modal/cursor-modal';

@Component({
    selector: 'silverNeedleChart',
    directives: [CHART_DIRECTIVES, NgClass],
    templateUrl: 'build/components/chart/chart.html',
})
export class SilverNeedleChart {
    @Output() chartLoad: EventEmitter<any> = new EventEmitter();
    private nav: NavController;
    public chart: Object;
    public timelineChart: Object;
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
    private oscopeChartInner: ElementRef;
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

    constructor(_nav: NavController) {
        this.activeTimeLine = -1;
        this.timeDivision = 3;
        this.base = 12;
        this.nav = _nav;
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
        this.timelineOptions = {
            chart: {
                type: 'line',
                zoomType: '',
                title: '',
                animation: false
            },
            title: {
                text: null
            },
            tooltip: {
                enabled: false
            },
            series: [{
                data: [29.9, 36, 47, 57, 67, 71.5, 82, 92, 102, 106.4, 110, 120, 129.2],
            }, {
                data: [50, 60, 70, 80],
                yAxis: 0
            }],
            legend: {
                enabled: false
            },
            yAxis: [{
                offset: 0,
                title: {
                    text: null
                },
                labels: {
                    enabled: false
                }
            }, {
                offset: 0,
                title: {
                    text: null
                },
                labels: {
                    enabled: false
                }
            }],
            credits: {
                enabled: false
            },
            xAxis: {
                labels: {
                    enabled: false
                },
                plotBands: [{ // mark the weekend
                    color: 'rgba(182,191,190,0.5)',
                    from: 0,
                    to: 0,
                    id: 'plot-band-1'
                },{
                    color: 'rgba(182,191,190,0.5)',
                    from: 0,
                    to: 0,
                    id: 'plot-band-2'
                }],
                plotLines: [{
                    value: 0,
                    color: 'rgba(182,191,190,0.5)',
                    width: 10,
                    id: 'left',
                    zIndex: 100
                }, {
                    value: 0,
                    color: 'rgba(182,191,190,0.5)',
                    width: 10,
                    id: 'right',
                    zIndex: 100
                }]
            },
            plotOptions: {
                series: {
                    pointInterval: 2,
                    pointStart: 0,
                    stickyTracking: false,
                    states: {
                        hover: {
                            enabled: false
                        }
                    }
                },
                line: {
                    marker: {
                        enabled: false
                    }
                }
            }
        };
        this.options = {
            chart: {
                type: 'line',
                zoomType: '',
                title: '',
                animation: false,
                //panning: true,
                //panKey: 'shift'
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


    //Called once on component load
    onLoad(chartInstance) {
        //Save a reference to the chart object so we can call methods on it later
        this.chart = chartInstance;
        
        //Redraw chart to scale chart to container size
        this.redrawChart();
        this.chartLoad.emit(this.chart);
    }

    onTimelineLoad(chartInstance) {
        this.timelineChart = chartInstance;
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

    onPointSelect (event) {
        console.log(event);
        this.activeSeries = event.context.series.index + 1;
        console.log('Active Series: ' + this.activeSeries);
        this.updateYAxisLabels();
    }

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

    setXView(position, secsPerDiv) {
        position = parseFloat(position);
        secsPerDiv = parseFloat(secsPerDiv);

        let delta = 5 * secsPerDiv;
        let min = position - delta;
        let max = position + delta;

        this.chart.xAxis[0].setExtremes(min, max);
    }

    getNumAxes() {
        return this.chart.yAxis.length;
    }

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
        this.chart.reflow();
        this.updateCursorLabels();
        if (this.timelineView) {
            this.timelineChart.series[seriesNum].setData(waveform.y, true, false, false);
            this.timelineChart.series[seriesNum].update({
                pointStart: waveform.t0,
                pointInterval: waveform.dt
            });
            this.timelineChart.reflow();
            let extremesX = this.timelineChart.xAxis[0].getExtremes();
            let extremesY = this.timelineChart.yAxis[0].getExtremes();
            this.timelineBounds = [extremesX.min, extremesX.max, extremesY.dataMin, extremesY.dataMax];
            this.chartBoundsX = this.chart.xAxis[0].getExtremes();
            let left = this.chart.xAxis[0].toValue(this.chart.xAxis[0].toPixels(this.chartBoundsX.min) - 5);
            let right = this.chart.xAxis[0].toValue(this.chart.xAxis[0].toPixels(this.chartBoundsX.max) + 5);
            this.updatePlotBands([2, 3], [[extremesX.min, this.chartBoundsX.min], [this.chartBoundsX.max, extremesX.max]]);
            this.updatePlotLines([0, 1], [left, right]);
        }
    }

    clearExtraSeries(usedSeries: number[]) {
        if (this.chart.series.length <= usedSeries.length) {
            return;
        }
        let lengthExists = this.chart.series.length;
        for (let i = usedSeries.length; i < lengthExists; i++) {
            this.chart.series[i].remove(false);
            this.chart.yAxis[i].remove(false);
        }
    }

    removeCursors() {
        this.chart.xAxis[0].removePlotLine('cursor0');
        this.chart.xAxis[0].removePlotLine('cursor1');
        this.chart.yAxis[0].removePlotLine('cursor2');
        this.chart.yAxis[0].removePlotLine('cursor3');
        if (this.timelineView) {
            console.log(this.timelineChart.xAxis[0].plotLinesAndBands, this.timelineChart.yAxis[0].plotLinesAndBands);
            this.timelineChart.xAxis[0].removePlotLine('timelineCursor0');
            this.timelineChart.xAxis[0].removePlotLine('timelineCursor1');
            this.timelineChart.yAxis[0].removePlotLine('timelineCursor2');
            this.timelineChart.yAxis[0].removePlotLine('timelineCursor3');
        }
        console.log(this.cursorLabel, this.cursorAnchors);
        for (let i = 0; i < this.cursorLabel.length; i++) {
            if (typeof(this.cursorLabel[i]) === 'object') {
                this.cursorLabel[i].destroy();
                this.cursorAnchors[i].destroy();
                this.cursorAnchors[i] = 'empty';
                this.cursorLabel[i] = 'empty';
                console.log('rekt label ' + i);
            }
        }
        this.numXCursors = 0;
        this.numYCursors = 0;
        this.xCursorPositions = [0, 0, 0, 0, 0, 0];
        this.yCursorPositions = [0, 0];
    }

    addXCursor() {
        console.log('adding x cursor');
        console.log(this.chart.series[0].color);
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
            console.log(this.timelineChart.xAxis[0].plotLinesAndBands);
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

    addYCursor() {
        console.log('adding Y cursor number: ' + this.numYCursors);
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
                console.log(this.timelineChart.yAxis[0].plotLinesAndBands);
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
                console.log('Ystop')
                this.activeCursor = -1;
            });

        this.numYCursors++;
    }
    

    xCursorStartDrag(cursorId, xStartPos) {
        if (this.cursorType === 'track') {
            this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.trackCursorDragListener);
        }
        else {
            this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.cursorDragListener);
        }
        this.oscopeChartInner.nativeElement.addEventListener('mouseup', this.xCursorStopDrag.bind(this));
    }

    yCursorStartDrag(cursorId, xStartPos) {
        this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.yCursorDragListener);
        this.oscopeChartInner.nativeElement.addEventListener('mouseup', this.yCursorStopDrag.bind(this));
    }

    xCursorStopDrag() {
        if (this.cursorType === 'track') {
            this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.trackCursorDragListener);
        }
        else {
            this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.cursorDragListener);
        }
    }

    yCursorStopDrag() {
        this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.yCursorDragListener);
    }

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
        //Need to add case for series[0] limit to length
        //Ask if all data will have equal num points?
        if (pointNum > this.chart.series[1].yData.length - 1) {
            pointNum2 = this.chart.series[1].yData.length - 1;
        }
        //console.log(this.chart.series[0].data[pointNum].plotY + 15);
        //this.chart.xAxis[0].plotLinesAndBands[0].svgElem.translate(event.clientX - this.xCursorDragStartPos);
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

    getNumCursors() {
        return this.numXCursors;
    }

    setElementRef(element) {
        this.oscopeChartInner = element;
        console.log('ElementRef set in chart component :D');
    }

    getCursorDeltas() {
        //[xdeltas, series 0 ydeltas on x cursors, series 1 ydeltas on x cursors, ydeltas on y cursors]
        let xDelta = Math.abs(this.xCursorPositions[3] - this.xCursorPositions[0]);
        let xDeltaSer0Y = Math.abs(this.xCursorPositions[4] - this.xCursorPositions[1]);
        let xDeltaSer1Y = Math.abs(this.xCursorPositions[5] - this.xCursorPositions[2]);
        let yDelta = Math.abs(this.yCursorPositions[1] - this.yCursorPositions[0]);
        return [xDelta, xDeltaSer0Y, xDeltaSer1Y, yDelta];
    }

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

    openCursorModal() {
        let modal = Modal.create(ModalCursorPage, {
            cursorType: this.cursorType,
            cursor1Chan: this.cursor1Chan,
            cursor2Chan: this.cursor2Chan
        });
        modal.onDismiss(data=> {
            if (data.save) {
                console.log('saving data', data);
                this.cursorType = data.cursorType;
                this.cursor1Chan = data.cursor1Chan;
                this.cursor2Chan = data.cursor2Chan;
                this.handleCursors();
            }
        });
        this.nav.present(modal);
    }

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

    enableCursors() {
        this.cursorsEnabled = true;
        console.log(this.cursorsEnabled);
        //Wait for ngClass to apply css class and reflow chart to fill correctly. 
        //TODO check for ngclass event that fires on class change.
        setTimeout(() => {
            this.chart.reflow();
        }, 50);
    }

    clearSeries() {
        let numSeries = this.chart.series.length;
        //remove all series except series 0
        for (let i = 0; i < numSeries - 1; i++) {
            this.chart.series[numSeries - i - 1].remove(false);
        }
            //this.chart.series[1].remove(false);
        
    }

    onChartClick(event) {
        if (event.srcElement.localName === 'rect' && this.oscopeChartInner !== undefined && event.srcElement.id === '') {
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
        else {
        }
    }

    clearMouse() {
        this.canPan = false;
        if (this.oscopeChartInner !== undefined) {
            this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.panListener);
            this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.verticalOffsetListener);
            this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.timelineWhiteDragListener);
        }
    }

    panListener = function(event) {
        let newVal = this.chart.xAxis[0].toValue(event.chartX);
        let oldValinNewWindow = this.chart.xAxis[0].toValue(this.xPositionPixels);
        let difference = newVal - oldValinNewWindow;
        this.setXExtremes(difference);
        this.updateCursorLabels();
        this.xPositionPixels = event.chartX;
    }.bind(this);

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
        this.voltBase[this.activeSeries - 1] = (parseFloat(this.voltBase[this.activeSeries - 1]) - difference).toFixed(3);
        this.yPositionPixels = event.chartY;
    }.bind(this);

    setXExtremes(positionChange: number) {
        let newPos = this.base - positionChange;
        let min = newPos - this.timeDivision * 5;
        let max = newPos + this.timeDivision * 5; 
        this.chart.xAxis[0].setExtremes(min, max, true, false);
        this.base = parseFloat(newPos.toFixed(3));
        this.updatePlotBands([2, 3], [[this.timelineBounds[0], min], [max, this.timelineBounds[1]]]);
        let val1 = this.timelineChart.xAxis[0].toValue(this.timelineChart.xAxis[0].toPixels(min) - 5);
        let val2 = this.timelineChart.xAxis[0].toValue(this.timelineChart.xAxis[0].toPixels(max) + 5);
        this.updatePlotLines([0, 1], [val1, val2]);
        this.attachPlotLineEvents();
    }

    setYExtremes(seriesSettings: any) {
        let offset = parseFloat(seriesSettings.voltBase);
        let min = offset - (parseFloat(seriesSettings.voltsPerDiv) * 5);
        let max = offset + (parseFloat(seriesSettings.voltsPerDiv) * 5);
        this.chart.yAxis[seriesSettings.seriesNum].setExtremes(min, max);
        this.updateCursorLabels();
    }

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

    setSeriesSettings(seriesSettings: any) {
        this.voltDivision[seriesSettings.seriesNum] = seriesSettings.voltsPerDiv;
        this.voltBase[seriesSettings.seriesNum] = seriesSettings.voltBase;
        this.setYExtremes(seriesSettings);
    }

    setActiveSeries(seriesNum: number) {
        this.activeSeries = seriesNum;
        this.updateYAxisLabels();
        this.updateCursorLabels();
    }

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

    autoscaleAxis(axis: string, axisIndex: number) {
        if (axis === 'x') {
            this.chart.xAxis[axisIndex].setExtremes(this.chart.xAxis[0].dataMin, this.chart.xAxis[0].dataMax);
            this.timeDivision = parseFloat(((this.chart.xAxis[0].dataMax - this.chart.xAxis[0].dataMin) / 10).toFixed(3));
            this.base = parseFloat(((this.chart.xAxis[0].dataMax + this.chart.xAxis[0].dataMin) / 2).toFixed(3));
            let extremes = this.chart.xAxis[0].getExtremes();
            this.updatePlotBands([2, 3], [[this.timelineBounds[0], extremes.dataMin], [extremes.dataMax, this.timelineBounds[1]]]);
            let left = this.chart.xAxis[0].toValue(this.chart.xAxis[0].toPixels(extremes.dataMin) - 5);
            let right = this.chart.xAxis[0].toValue(this.chart.xAxis[0].toPixels(extremes.dataMax) + 5);
            this.updatePlotLines([0, 1], [left, right]);
        }
        else if (axis === 'y') {
            this.chart.yAxis[axisIndex].setExtremes(this.chart.yAxis[axisIndex].dataMin, this.chart.yAxis[axisIndex].dataMax);
            this.voltBase[axisIndex] = parseFloat(((this.chart.yAxis[axisIndex].dataMax + this.chart.yAxis[axisIndex].dataMin) / 2).toFixed(3));
            this.voltDivision[axisIndex] = parseFloat(((this.chart.yAxis[axisIndex].dataMax - this.chart.yAxis[axisIndex].dataMin) / 10).toFixed(3));
        }
        else {
            console.log('invalid axis');
        }
        this.updateCursorLabels();
    }

    enableTimelineView() {
        this.timelineView = true;
        setTimeout(() => {
            this.chart.reflow();
        }, 50);
    }

    isCursorTimeline() {
        if (this.cursorsEnabled && this.timelineView) {
            return true;
        }
        return false;
    }

    isCursorOnly() {
        if (this.cursorsEnabled && !this.timelineView) {
            return true;
        }
        return false;
    }

    isTimelineOnly() {
        if (!this.cursorsEnabled && this.timelineView) {
            return true;
        }
        return false;
    }

    isVanilla() {
        if (!this.cursorsEnabled && !this.timelineView) {
            return true;
        }
        return false;
    }

    timelineChartClick(event) {
        let chartExtremes = this.chart.xAxis[0].getExtremes();
        let value = this.timelineChart.xAxis[0].toValue(event.chartX)
        if (value > chartExtremes.min && value < chartExtremes.max && !this.inTimelineDrag) {
            this.xPositionPixels = event.chartX;
            this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.timelineWhiteDragListener);
        }
    }

    attachPlotLineEvents() {
        for (let i = 0; i < 2; i++) {
            if (this.timelineChart.xAxis[0].plotLinesAndBands[i].svgElem !== undefined) {
                this.timelineChart.xAxis[0].plotLinesAndBands[i].svgElem.css({
                    'cursor': 'pointer'
                })
                    .on('mousedown', (event) => {
                        this.inTimelineDrag = true;
                        console.log('mousedown' + i);
                        this.startTimelineDrag(i);
                    })
                    .on('mouseup', (event) => {
                        this.inTimelineDrag = false;
                        console.log('mouseup' + i);
                        this.clearDragListener(i);
                    });
            }
        
        }

    }

    startTimelineDrag(lineNum: number) {
        this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.timelineDragListener);
        this.activeTimeLine = lineNum;
        this.chartBoundsX = this.chart.xAxis[0].getExtremes();
    }

    clearDragListener(lineNum: number) {
        this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.timelineDragListener);
        this.activeTimeLine = -1;
    }

    timelineDragListener = function(event) {
        let newVal = this.timelineChart.xAxis[0].toValue(event.chartX);
        let xCor: number;
        if (this.activeTimeLine === 0) {
            xCor = event.chartX - 5;
            if (event.chartX > this.timelineChart.xAxis[0].toPixels(this.timelineChart.xAxis[0].plotLinesAndBands[3].options.from)){
                xCor = this.timelineChart.xAxis[0].toPixels(this.timelineChart.xAxis[0].plotLinesAndBands[3].options.from) - 5;
                newVal = this.timelineChart.xAxis[0].plotLinesAndBands[3].options.from;
            }
            this.updatePlotBands([2], [[this.timelineBounds[0], newVal]]);
            this.timelineChart.xAxis[0].plotLinesAndBands[0].options.value = this.timelineChart.xAxis[0].toValue(xCor);
            this.timelineChart.xAxis[0].plotLinesAndBands[0].render();
            this.chart.xAxis[0].setExtremes(this.timelineChart.xAxis[0].toValue(xCor + 5), this.chartBoundsX.max);
        }
        else if (this.activeTimeLine === 1) {
            xCor = event.chartX + 5;
            if (event.chartX < this.timelineChart.xAxis[0].toPixels(this.timelineChart.xAxis[0].plotLinesAndBands[2].options.to)){
                xCor = this.timelineChart.xAxis[0].toPixels(this.timelineChart.xAxis[0].plotLinesAndBands[2].options.to) + 5;
                newVal = this.timelineChart.xAxis[0].plotLinesAndBands[2].options.to;
            }
            this.updatePlotBands([3], [[newVal, this.timelineBounds[1]]]);
            this.timelineChart.xAxis[0].plotLinesAndBands[1].options.value = this.timelineChart.xAxis[0].toValue(xCor);
            this.timelineChart.xAxis[0].plotLinesAndBands[1].render();
            this.chart.xAxis[0].setExtremes(this.chartBoundsX.min, this.timelineChart.xAxis[0].toValue(xCor - 5));
        }
        let newExtremes = this.chart.xAxis[0].getExtremes();
        this.base = ((newExtremes.min + newExtremes.max) / 2).toFixed(3);
        this.timeDivision = ((newExtremes.max - newExtremes.min) / 10).toFixed(3);
        this.updateCursorLabels();
    }.bind(this);

    timelineWhiteDragListener = function(event) {
        let newVal = this.timelineChart.xAxis[0].toValue(event.chartX);
        let oldValinNewWindow = this.timelineChart.xAxis[0].toValue(this.xPositionPixels);
        let difference = oldValinNewWindow - newVal;
        this.setXExtremes(difference);
        this.updateCursorLabels();
        this.xPositionPixels = event.chartX;
    }.bind(this);

    updatePlotBands(indices: number[], values: Array<number[]>) {
        for (let i = 0; i < indices.length; i++) {
            this.timelineChart.xAxis[0].plotLinesAndBands[indices[i]].options.from = values[i][0];
            this.timelineChart.xAxis[0].plotLinesAndBands[indices[i]].options.to = values[i][1];
            this.timelineChart.xAxis[0].plotLinesAndBands[indices[i]].render();
        }
    }

    updatePlotLines(indices: number[], values: number[]) {
        for (let i = 0; i < indices.length; i++) {
            this.timelineChart.xAxis[0].plotLinesAndBands[indices[i]].options.value = values[i];
            this.timelineChart.xAxis[0].plotLinesAndBands[indices[i]].render()
        }
    }

    changeMultiplier(seriesNum: number, multiplier: string, previousSetting: string) {
        console.log(this.chart.series);
        if (multiplier === previousSetting) {
            return;
        }
        if (multiplier === 'mV') {
            let newValArray = [];
            this.chart.series[seriesNum].yData.forEach((element, index, array) => {
                newValArray[index] = parseFloat(element) * 1000;
            });
            this.chart.series[seriesNum].setData(newValArray, true, false, false);
            this.chart.reflow();
        }
        else if (multiplier === 'V') {
            let newValArray = [];
            this.chart.series[seriesNum].yData.forEach((element, index, array) => {
                newValArray[index] = parseFloat(element) / 1000;
            });
            this.chart.series[seriesNum].setData(newValArray, true, false, false);
            this.chart.reflow();
        }
    }

}
