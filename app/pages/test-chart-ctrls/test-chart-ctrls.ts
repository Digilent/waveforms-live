import {Page} from 'ionic-angular';
import {ViewChild, ElementRef, Component} from '@angular/core';

//Components
import {SilverNeedleChart} from '../../components/chart/chart.component';
import {OscilloscopeComponent} from '../../components/oscilloscope/oscilloscope.component';
import {BottomBarComponent} from '../../components/bottom-bar/bottom-bar.component';
import {SideBarComponent} from '../../components/side-bar/side-bar.component';

@Component({
    templateUrl: 'build/pages/test-chart-ctrls/test-chart-ctrls.html',
    directives: [SilverNeedleChart, OscilloscopeComponent, BottomBarComponent, SideBarComponent]
})
export class TestChartCtrlsPage {
    @ViewChild('chart1') chart1: SilverNeedleChart;
    @ViewChild('oscopeChartInner') oscopeChartInner: ElementRef;
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
        this.chart1.addCursor();
    }

    addYCursor() {
        this.chart1.addYCursor();
    }

    singleClick() {
        console.log('single');
    }

    runClick() {
        console.log('run');
        this.removeCursors();
    }

    exportChart() {
        console.log('export not yet implemented');
        this.chart1.addYCursor();
    }

    setTitle() {
        //remove
        this.chart1.setTitle('Sup Son? ¯\\_(ツ)_/¯');
    }

    setContainerRef() {
        console.log('Setting container element ref in chart component');
        this.chart1.setElementRef(this.oscopeChartInner);
    }

    removeCursors() {
        this.chart1.removeCursors();
    }
}
