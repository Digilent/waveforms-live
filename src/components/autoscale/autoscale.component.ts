import {Component, Input} from '@angular/core';

//Components 
import {SilverNeedleChart} from '../chart/chart.component';

@Component({
    templateUrl: 'autoscale.html',
    selector: 'autoscale'
})
export class AutoscaleComponent {
    @Input() chart: SilverNeedleChart;
    public delay: string = '0';
    public show: boolean = true;
    constructor() {

    }

    autoscaleAxis(axis: string, seriesNum: number) {
        this.chart.autoscaleAxis(axis, seriesNum);
    }

    autoscaleAll() {
        this.chart.autoscaleAllAxes();
    }

}
