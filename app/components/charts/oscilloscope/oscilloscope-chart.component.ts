import {Component} from 'angular2/core';
import {Http, HTTP_PROVIDERS} from 'angular2/http';
import {IONIC_DIRECTIVES} from 'ionic-angular';
import {CHART_DIRECTIVES, Highcharts} from 'angular2-highcharts';

@Component({
    selector: 'oscilloscope-chart',
    templateUrl: 'build/components/charts/oscilloscope/oscilloscope-chart.html',
    directives: [CHART_DIRECTIVES, IONIC_DIRECTIVES],
    viewProviders: [HTTP_PROVIDERS],
})
export class OscilloscopeChartComponent {
    private chart: Object;
    private options: Object;
    private data: Array<number>;

    public sampleRate: number;
    public numSamples: number;
    public sigFreq: number;
    public phaseOffset: number;

    constructor(private http: Http) {
        this.sampleRate = 10000;
        this.numSamples = 100;
        this.sigFreq = 200;
        this.phaseOffset = 0;

        this.options = {
            chart: {
                type: 'line',
                zoomType: 'x',
                title: ''
            },
            tooltip: {
                shared: true,
                formatter: function() {
                    let tip = '<b>' + this.x.toFixed(2) + '</b>';
                    this.points.forEach(function(point){
                        tip += '<br/>' + point.series.name + ': ' + point.y.toFixed(2) + ' MEGAVOLTS!';
                    });
                    
                    return tip;
                },
            },
            series: [
                {
                    name: 'Channel 0',
                    data: [],
                },
                {
                    name: 'Channel 1',
                    data: [],
                }
            ]

        };
    }

    saveInstance(instance) {
        this.chart = instance;
    }

    refresh(sampleRate, numSamples, sigFreq, phaseOffset) {
        let url = 'https://0u7h6sgzf6.execute-api.us-east-1.amazonaws.com/prod';
        let params = {
            "sigType": "sin",
            "sampleRate": sampleRate,
            "numSamples": numSamples,
            "sigFreq": sigFreq,
            "phaseOffset": phaseOffset
        };

        this.http.post(url, JSON.stringify(params)).subscribe((response) => {
            if (response.status != 200) {
                console.log(Error, 'Bad Response: ', response);
            }
            else {
                let waveform = JSON.parse(response.text());

                this.drawWaveform(this.chart, 0, waveform);


            }
        });
    }

    drawWaveform(chart, seriesNum, waveform) {
        chart.options.tooltip.valueSuffix = 'Dags';
        chart.series[seriesNum].options.pointStart = waveform.t0;
        chart.series[seriesNum].options.pointInterval = waveform.dt;
        chart.series[seriesNum].setData(waveform.y);
    }
    
    reflowChart()
    {
        console.log('asdf');
       this.chart.reflow(); 
    }
}