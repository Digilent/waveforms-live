import {Component} from 'angular2/core';
import {Http, HTTP_PROVIDERS} from 'angular2/http';
import {IONIC_DIRECTIVES} from 'ionic-angular';
import {CHART_DIRECTIVES, Highcharts} from 'angular2-highcharts';

@Component({
    selector: 'oscilloscope-chart',
    templateUrl: 'build/components/charts/oscilloscope/oscilloscope-chart.html',
    directives: [CHART_DIRECTIVES, IONIC_DIRECTIVES],
})
export class OscilloscopeChartComponent {
    private refreshData = "empty";
    private options: Object;
    private data: any = 'test';
    
    constructor(http: Http) {
        this.options = {
            chart: {
                type: 'line',
                zoomType: 'x',
            },
            series: [{
                data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            }]
        };
        
        //http.get('people.json').map(res => res.json()).subscribe(data => this.data = data);
    }
    

    refresh() {
        //this.refreshData = this.http.post("https://0u7h6sgzf6.execute-api.us-east-1.amazonaws.com/prod/", "{'operation': 'sin'}").map(function(response) { return response.json(); });
        alert(
            this.data
        );
    }
}