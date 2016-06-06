import {Page} from 'ionic-angular';
import {ViewChild} from 'angular2/core';

//Components
import {SilverNeedleChart} from '../../components/chart/chart.component';
import {OscilloscopeComponent} from '../../components/oscilloscope/oscilloscope.component';
import {BottomBarComponent} from '../../components/bottom-bar/bottom-bar.component';
import {SideBarComponent} from '../../components/side-bar/side-bar.component';

@Page({
    templateUrl: 'build/pages/test-chart-ctrls/test-chart-ctrls.html',
    directives: [SilverNeedleChart, OscilloscopeComponent, BottomBarComponent, SideBarComponent]
})
export class TestChartCtrlsPage {
    @ViewChild('chart1') chart1: SilverNeedleChart;
    //@ViewChild('chart2') chart2: OscilloscopeComponent;

    public controlsVisible = false;
    public botVisible = false;
    public sideVisible = false;
    
    private xPosition;
    private numXCursors;
    private cursorLabel;
    private xCursorDragStartPos;
    

    constructor() {
        
    }

    toggleControls() {
        this.controlsVisible = !this.controlsVisible;
        console.log(this.chart1);
        //this.chart1.options.chart.height = 400;
        //this.chart1.redrawChart();

        setTimeout(() => {
            this.chart1.redrawChart();
        }, 550);

        /*
        for (let i = 0; i < 10; i++) {
            this.chart1.redrawChart();
        }
        */
        //console.log(this.controlsVisible);
    }
    
    toggleBotControls() {
        this.botVisible = !this.botVisible;
        setTimeout(() => {
            this.chart1.redrawChart();
        }, 550);
    }

    toggleSideControls() {
        this.sideVisible = !this.sideVisible;
        setTimeout(() => {
            this.chart1.redrawChart();
        }, 550);
    }
    
    toggleSeries(event) {
        this.chart1.chart.series[event.channel].setVisible(event.value, true);
    }
    
    addCursor() {
        this.chart1.chart.xAxis[0].addPlotLine({
            value: this.xPosition,
            color: 'blue',
            width: 3,
            zIndex: 100 + this.numXCursors,
            id: 'cursor' + this.numXCursors,
        });

        this.cursorLabel = this.chart1.chart.renderer.text('Cursor 0', 100, 100).add();

        //let options = this.chart.options;
        //console.log(options);
        this.chart1.chart.options.chart.events.click = function (event) {
            console.log(event);
        };
        console.log(this.chart1.chart.options);
        //this.chart = new Highcharts.Chart(options);

        //Set Mouse To Pointer On Hover Over
        this.chart1.chart.xAxis[0].plotLinesAndBands[0].svgElem.css({
            'cursor': 'pointer'
        })

            .on('mousedown', (event) => {
                // console.log('start')
                this.xCursorDragStartPos = event.clientX;
                this.xCursorStartDrag(0, event.clientX);
            })
            .on('mouseup', (event) => {
                console.log('mouse released on cursor');
                //console.log('stop')
            });

        this.numXCursors++;
    }

    xCursorStartDrag(cursorId, xStartPos) {
        console.log('start');
        this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.cursorDragListener);
        this.oscopeChartInner.nativeElement.addEventListener('mouseup', this.xCursorStopDrag.bind(this));
    }

    xCursorStopDrag() {
        this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.cursorDragListener);
        console.log('done');
        //console.log(this.chart.xAxis[0].plotLinesAndBands[0].options.value);

    }

    //
    cursorDragListener = function (event) {
        //TODO FORCE BETWEEN MIN / MAX
        let xVal = this.chart1.chart.xAxis[0].translate(event.layerX - this.chart.plotLeft, true).toFixed(1);       
        let pointNum = Math.round((xVal - this.chart1.chart.series[0].data[0].x) / this.chart1.chart.series[0].options.pointInterval);
        //console.log(this.chart.series[0].data[pointNum].plotY + 15);
        //this.chart.xAxis[0].plotLinesAndBands[0].svgElem.translate(event.clientX - this.xCursorDragStartPos);
        this.chart.xAxis[0].plotLinesAndBands[0].options.value = xVal;
        this.chart.xAxis[0].plotLinesAndBands[0].render();
        this.cursorLabel.attr({
            text: this.chart1.chart.series[0].data[pointNum].y.toFixed(3) + 'V', 
            x: event.chartX + 5,
            y: this.chart1.chart.series[0].data[pointNum].plotY - 15
        });
    }.bind(this);

}
