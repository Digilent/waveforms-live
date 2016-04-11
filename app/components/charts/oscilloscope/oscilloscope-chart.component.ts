import {Component} from 'angular2/core';
import {CHART_DIRECTIVES, Highcharts} from 'angular2-highcharts';

@Component({
    selector: 'oscilloscope-chart',
    templateUrl: 'build/components/charts/oscilloscope/oscilloscope-chart.html',
    directives: [CHART_DIRECTIVES],
})
export class OscilloscopeChartComponent {
    private options: Object;
    constructor() {
        this.options = {           
            series: [{
                data: [29.9, 71.5, 106.4, 129.2],
            }]
        };
    }
}