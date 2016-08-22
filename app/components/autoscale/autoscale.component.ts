import {Component, Input} from '@angular/core';
import {NgClass} from '@angular/common';

//Components 
import {SilverNeedleChart} from '../chart/chart.component';

@Component({
    templateUrl: 'build/components/autoscale/autoscale.html',
    selector: 'autoscale',
    directives: [NgClass]
})
export class AutoscaleComponent {
    @Input() chart: SilverNeedleChart;
    private delay: string = '0';
    private show: boolean = true;
    constructor() {

    }

    //Remove storage event listener to avoid memory leaks
    ngOnDestroy() {

    }

    toggleVisibility() {
        this.show = !this.show;
    }

    autoscaleAxis(axis: string, seriesNum: number) {
        this.chart.autoscaleAxis(axis, seriesNum);
    }

    autoscaleAll() {
        this.chart.autoscaleAllAxes();
    }

    setAutoscaleX(event) {
        console.log(this.chart.autoscaleYaxes);
    }

}
