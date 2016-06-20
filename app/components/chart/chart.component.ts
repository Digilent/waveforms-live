import { Component, Output, Input, EventEmitter, ElementRef } from '@angular/core';
import { CHART_DIRECTIVES } from 'angular2-highcharts';

@Component({
    selector: 'silverNeedleChart',
    directives: [CHART_DIRECTIVES],
    templateUrl: 'build/components/chart/chart.html',
})
export class SilverNeedleChart {
    @Output() chartLoad: EventEmitter<any> = new EventEmitter();
    public chart: Object;
    private options: Object;
    private xPosition: number;
    private yPosition: number;
    private numXCursors: number;
    private cursorLabel: any[];
    private xCursorDragStartPos: any;
    private oscopeChartInner: ElementRef;
    private activeCursor: number;
    private activeSeries: number;
    private numYCursors: number;

    //[x1, series 0 y1, series 1 y1, x2, series 0 y2, series 1 y2]
    private xCursorPositions: number[];
    //[y1, y2]
    private yCursorPositions: number[];

    constructor() {
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
                title: '',
                animation: false,
            },
            series: [{
                data: [29.9, 71.5, 106.4, 129.2],
                allowPointSelect: true
            },
            {
                data: [50, 60, 70, 80],
                allowPointSelect: true
            }
            ],
            yAxis: {
                gridLineWidth: 1,
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
            },
            plotOptions: {
                series: {
                    pointInterval: 2,
                    pointStart: 0
                }
            },
            credits: {
                enabled: false
            },
            xAxis: {
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
        this.redrawChart()
        this.chartLoad.emit(this.chart);
        
    }

    onPointSelect (event) {
      this.activeSeries = event.context.series._i + 1;
      console.log('Active Series: ' + this.activeSeries);
    }
    
    /*
    ngAfterViewChecked()
    {
        console.log('AfterViewChecked');
        if(this.chart != undefined)
        {
            this.chart.reflow();
            console.log('reflew!');
        }
    }
    */
    
    redrawChart()
    {
      if(this.chart != undefined)
        {
            this.chart.reflow();
            console.log('redrawChart()');
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

    drawWaveform(seriesNum: number, waveform: any) {
        this.chart.series[seriesNum].update({
            pointStart: 0,
            pointInterval: waveform.dt
        })
        //console.log(this.chart.series[0].options.pointInterval);
        this.chart.series[seriesNum].setData(waveform.y, true, false, false);
        this.chart.reflow();
    }

    removeCursors() {
        this.chart.xAxis[0].removePlotLine('cursor0');
        this.chart.xAxis[0].removePlotLine('cursor1');
        this.chart.yAxis[0].removePlotLine('cursor2');
        this.chart.yAxis[0].removePlotLine('cursor3');
        console.log(this.cursorLabel);
        for (let i = 0; i < this.cursorLabel.length; i++) {
            if (typeof(this.cursorLabel[i]) === 'object') {
                this.cursorLabel[i].destroy();
                this.cursorLabel[i] = 'empty';
                console.log('rekt label ' + i);
            }
        }
        this.numXCursors = 0;
        this.numYCursors = 0;
        this.xCursorPositions = [0, 0, 0, 0, 0, 0];
        this.yCursorPositions = [0, 0];
    }

    addCursor() {
        this.chart.series[0].options.pointInterval = 1;
        console.log('adding cursor');
        this.chart.xAxis[0].addPlotLine({
            value: this.chart.xAxis[0].dataMin,
            color: 'blue',
            width: 3,
            zIndex: 100 + this.numXCursors,
            id: 'cursor' + this.numXCursors,
        });
        this.xCursorPositions[3 * this.numXCursors] = this.chart.xAxis[0].dataMin;
        this.xCursorPositions[3 * this.numXCursors + 1] = this.chart.series[0].data[0].y;
        this.xCursorPositions[3 * this.numXCursors + 2] = this.chart.series[1].data[0].y;
        console.log(this.xCursorPositions);
        this.cursorLabel[this.numXCursors] = this.chart.renderer.text('Cursor ' + this.numXCursors, 100, 100).add();
        this.chart.xAxis[0].plotLinesAndBands[this.numXCursors].svgElem.element.id = 'cursor' + this.numXCursors;
        //let options = this.chart.options;
        //console.log(options);
        this.chart.options.chart.events.click = function (event) {
            console.log('chart click');
        };
        //this.chart = new Highcharts.Chart(options);
        //Set Mouse To Pointer On Hover Over
        this.chart.xAxis[0].plotLinesAndBands[this.numXCursors].svgElem.css({
            'cursor': 'pointer'
        })

            .on('mousedown', (event) => {
                this.activeCursor = parseInt(event.srcElement.id.slice(-1)) + 1;
                this.xCursorDragStartPos = event.clientX;
                this.xCursorStartDrag(this.numXCursors, event.clientX);
            })
            .on('mouseup', (event) => {
                //console.log('mouse released on cursor');
                //console.log('stop')
                this.activeCursor = -1;
            });

        this.numXCursors++;
    }

    addYCursor() {
        console.log('adding Y cursor number: ' + this.numYCursors);
        this.chart.yAxis[0].addPlotLine({
            value: this.chart.yAxis[0].dataMin,
            color: 'red',
            width: 3,
            zIndex: 102 + this.numYCursors,
            id: 'cursor' + (this.numYCursors + 2)
        });
        this.yCursorPositions[this.numYCursors] = this.chart.yAxis[0].dataMin;
        console.log(this.yCursorPositions);
        this.cursorLabel[this.numYCursors + 2] = this.chart.renderer.text('Cursor ' + (this.numYCursors + 2), 100, 100).add();
        this.chart.yAxis[0].plotLinesAndBands[this.numYCursors].svgElem.element.id = 'cursor' + (this.numYCursors + 2);
        //let options = this.chart.options;
        //console.log(options);
        this.chart.options.chart.events.click = function (event) {
            console.log('chart click');
        };
        //this.chart = new Highcharts.Chart(options);
        //Set Mouse To Pointer On Hover Over
        this.chart.yAxis[0].plotLinesAndBands[this.numYCursors].svgElem.css({
            'cursor': 'pointer'
        })

            .on('mousedown', (event) => {
                this.activeCursor = parseInt(event.srcElement.id.slice(-1)) + 1;
                //this.xCursorDragStartPos = event.clientX;
                this.yCursorStartDrag(this.numYCursors + 2, event.clientX);
            })
            .on('mouseup', (event) => {
                //console.log('mouse released on cursor');
                console.log('Ystop')
                this.activeCursor = -1;
            });

        this.numYCursors++;
    }
    

    xCursorStartDrag(cursorId, xStartPos) {
        //console.log('start');
        this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.cursorDragListener);
        this.oscopeChartInner.nativeElement.addEventListener('mouseup', this.xCursorStopDrag.bind(this));
    }

    yCursorStartDrag(cursorId, xStartPos) {
        this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.yCursorDragListener);
        this.oscopeChartInner.nativeElement.addEventListener('mouseup', this.yCursorStopDrag.bind(this));
    }

    xCursorStopDrag() {
        this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.cursorDragListener);
        //console.log('done');
        //console.log(this.chart.xAxis[0].plotLinesAndBands[0].options.value);
    }

    yCursorStopDrag() {
        this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.yCursorDragListener);
        //console.log('done');
        //console.log(this.chart.xAxis[0].plotLinesAndBands[0].options.value);
    }

    yCursorDragListener = function (event) {
        //console.log(event);
        //SOME WEIRD Y PIXEL OFFSET SO NEED TO CORRECT BY CALCULATING YDELTA AND ADDING THAT TO YVAL CALCULATION
        let yDelta = event.layerY - (this.chart.yAxis[0].toPixels(parseFloat(this.chart.yAxis[0].toValue(event.chartY - this.chart.plotTop))));
        let yVal = parseFloat(this.chart.yAxis[0].toValue(event.chartY - this.chart.plotTop + yDelta)).toFixed(3);
        let xCor = event.layerX;
        let yCor = event.layerY;
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
        //console.log('pointNum: ' + pointNum, this.chart.series[0].data[0].y, this.chart.options.plotOptions.series.pointInterval);
        //console.log(this.chart.series[0].data[pointNum].plotY + 15);
        //this.chart.xAxis[0].plotLinesAndBands[0].svgElem.translate(event.clientX - this.xCursorDragStartPos);
        this.chart.yAxis[0].plotLinesAndBands[this.activeCursor - 3].options.value = yVal;
        this.yCursorPositions[this.activeCursor - 3] = parseFloat(yVal);
        this.chart.yAxis[0].plotLinesAndBands[this.activeCursor - 3].render();
        this.cursorLabel[this.activeCursor - 1].attr({
            text: yVal + 'V', 
            x: xCor,
            y: yCor - 10,
            zIndex: 99 + this.activeCursor
        });
    }.bind(this);

    cursorDragListener = function (event) {
        //TODO FORCE BETWEEN MIN / MAX using variables
        let xVal = this.chart.xAxis[0].translate(event.layerX - this.chart.plotLeft, true).toFixed(1); 
        let offset = 110;  
        let yCor = event.layerY;
        if (xVal < 0 || event.chartX < this.chart.plotLeft) {
            xVal = 0;
            //event.chartX = this.chart.plotLeft;
        }
        if (xVal > 6 || event.chartX > this.oscopeChartInner.nativeElement.clientWidth - this.chart.plotLeft) {
            xVal = 6;
            offset = -20;
        }
        if (yCor > this.chart.yAxis[0].toPixels(this.chart.yAxis[0].dataMin)) {
            yCor = this.chart.yAxis[0].toPixels(this.chart.yAxis[0].dataMin);
        }
        if (yCor < this.chart.yAxis[0].toPixels(this.chart.yAxis[0].dataMax)) {
            yCor = this.chart.yAxis[0].toPixels(this.chart.yAxis[0].dataMax);
        }
        let pointNum = Math.round((xVal - this.chart.series[0].data[0].x) / this.chart.options.plotOptions.series.pointInterval);
        //console.log(this.chart.series[0].data[pointNum].plotY + 15);
        //this.chart.xAxis[0].plotLinesAndBands[0].svgElem.translate(event.clientX - this.xCursorDragStartPos);
        this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value = xVal;
        this.xCursorPositions[3 * this.activeCursor - 3] = parseFloat(xVal);
        this.xCursorPositions[3 * this.activeCursor - 2] = this.chart.series[0].data[pointNum].y;
        this.xCursorPositions[3 * this.activeCursor - 1] = this.chart.series[1].data[pointNum].y;
        this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].render();
        this.cursorLabel[this.activeCursor - 1].attr({
            text: 'Series 1: ' + this.chart.series[0].data[pointNum].y.toFixed(3) + 'V' + 
            '<br>Series 2: ' + this.chart.series[1].data[pointNum].y.toFixed(3) + 'V', 
            x: this.chart.xAxis[0].translate(this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value, false) + offset,
            y: yCor,
            zIndex: 99 + this.activeCursor
        });
    }.bind(this);
    
    exportChart() {
        //see highcharts documentation. Local export requires modules/exporting.js
        //and modules/offline-exporting.js
        //this.chart.chart.exportChart();
        console.log('Export chart in chart component');
        this.chart.exportChartLocal();   
    }

    setHeight() {
        console.log('Height change not implemented');
        //this.chart.
        /*
        console.log(this.chart.container);
        this.chart.container = this.oscopeChartInner;
        this.chart.reflow();
        console.log(this.chart.container);
        */
    }

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
        console.log(this.xCursorPositions, this.yCursorPositions);
        let xDelta = Math.abs(this.xCursorPositions[3] - this.xCursorPositions[0]);
        let xDeltaSer0Y = Math.abs(this.xCursorPositions[4] - this.xCursorPositions[1]);
        let xDeltaSer1Y = Math.abs(this.xCursorPositions[5] - this.xCursorPositions[2]);
        let yDelta = Math.abs(this.yCursorPositions[1] - this.yCursorPositions[0]);
        return [xDelta, xDeltaSer0Y, xDeltaSer1Y, yDelta];
    }
}