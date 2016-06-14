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
    private numXCursors: number;
    private cursorLabel: any;
    private xCursorDragStartPos: any;
    private oscopeChartInner: ElementRef;

    constructor() {
        this.xPosition = 0;
        this.numXCursors = 0;
        this.options = {
           chart: {
                type: 'line',
                zoomType: '',
                title: '',
                animation: false,
           },
            series: [{
                data: [29.9, 71.5, 106.4, 129.2],
            }]
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
        //this.chart.series[seriesNum].options.pointStart = 0;//waveform.t0;
        //this.chart.series[seriesNum].options.pointInterval = waveform.dt;
        //console.log(this.chart.series[0].options.pointInterval);
        this.chart.series[seriesNum].setData(waveform, true, false, false);
        this.chart.reflow();
    }

    addCursor(container: ElementRef) {
        this.chart.series[0].options.pointInterval = 1;
        this.oscopeChartInner = container;
        console.log('adding cursor');
        this.chart.xAxis[0].addPlotLine({
            value: this.xPosition,
            color: 'blue',
            width: 3,
            zIndex: 100 + this.numXCursors,
            id: 'cursor' + this.numXCursors,
        });
        

        this.cursorLabel = this.chart.renderer.text('Cursor ' + this.numXCursors, 100, 100).add();

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
                console.log(event);
                this.xCursorDragStartPos = event.clientX;
                this.xCursorStartDrag(this.numXCursors, event.clientX);
            })
            .on('mouseup', (event) => {
                //console.log('mouse released on cursor');
                //console.log('stop')
            });

        this.numXCursors++;
    }
    

    xCursorStartDrag(cursorId, xStartPos) {
        //console.log('start');
        this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.cursorDragListener);
        this.oscopeChartInner.nativeElement.addEventListener('mouseup', this.xCursorStopDrag.bind(this));
    }

    xCursorStopDrag() {
        this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.cursorDragListener);
        //console.log('done');
        //console.log(this.chart.xAxis[0].plotLinesAndBands[0].options.value);

    }

    //
    cursorDragListener = function (event) {
        //TODO FORCE BETWEEN MIN / MAX
        let xVal = this.chart.xAxis[0].translate(event.layerX - this.chart.plotLeft, true).toFixed(1);       
        if (xVal < 0 || event.chartX < this.chart.plotLeft) {
            xVal = 0;
            event.chartX = this.chart.plotLeft;
        }
        if (xVal > 3 || event.chartX > this.oscopeChartInner.nativeElement.clientWidth - this.chart.plotLeft) {
            xVal = 3;
            event.chartX = this.oscopeChartInner.nativeElement.clientWidth - this.chart.plotLeft;
        }
        let pointNum = Math.round((xVal - this.chart.series[0].data[0].x) / this.chart.series[0].options.pointInterval);
        //console.log(this.chart.series[0].data[pointNum].plotY + 15);
        //this.chart.xAxis[0].plotLinesAndBands[0].svgElem.translate(event.clientX - this.xCursorDragStartPos);
        this.chart.xAxis[0].plotLinesAndBands[0].options.value = xVal;
        this.chart.xAxis[0].plotLinesAndBands[0].render();
        this.cursorLabel.attr({
            text: this.chart.series[0].data[pointNum].y.toFixed(3) + 'V', 
            x: event.chartX + 5,
            y: this.chart.series[0].data[pointNum].plotY - 15
        });
    }.bind(this);
    
    exportChart() {
        //see highcharts documentation. Local export requires modules/exporting.js
        //and modules/offline-exporting.js
        //this.chart.chart.exportChart();
        console.log('Export chart in chart component');
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
}