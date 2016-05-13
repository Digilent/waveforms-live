import {Page} from 'ionic-angular';
import {ViewChild} from 'angular2/core';

//Components
import {SilverNeedleChart} from '../../components/chart/chart.component';

@Page({
    templateUrl: 'build/pages/test-chart-ctrls/test-chart-ctrls.html',
    directives: [SilverNeedleChart]
})
export class TestChartCtrlsPage {
    @ViewChild('chart1') chart1: SilverNeedleChart;

    public controlsVisible = false;

    constructor() {

    }

    toggleControls() {
        this.controlsVisible = !this.controlsVisible;
        this.chart1.redrawChart();

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

}
