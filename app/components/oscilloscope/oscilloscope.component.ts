import {Component} from 'angular2/core';
import {Http, HTTP_PROVIDERS} from 'angular2/http';
import {IONIC_DIRECTIVES} from 'ionic-angular';
import {CHART_DIRECTIVES, Highcharts} from 'angular2-highcharts';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

@Component({
    selector: 'oscilloscope-chart',
    templateUrl: 'build/components/oscilloscope/oscilloscope.html',
    directives: [CHART_DIRECTIVES, IONIC_DIRECTIVES],
    viewProviders: [HTTP_PROVIDERS],
})
export class OscilloscopeComponent {
    private chart: Object;
    private options: Object;
    private data: Array<number>;

    public sampleRate: number;
    public numSamples: number;
    public sigFreq: number;
    public phaseOffset: number;

    public state: string = 'idle';

    //test code
    public frame: number = 0;
    private dataSource: Observable<any>;
    private dataSourceSubscription: any;
    public run: boolean = false;

    public min: number = 0;
    public max: number = 0;
    public secsPerDiv = 1;
    public position = 5;

    constructor(private http: Http) {
        this.sampleRate = 10000;
        this.numSamples = 100;
        this.sigFreq = 200;
        this.phaseOffset = 0;

        this.options = {
            chart: {
                type: 'line',
                zoomType: 'x',
                title: '',
                animation: false
                //backgroundColor: '#141414',
            },
            title: {
                text: '',
            },
            plotOptions: {
                series: {
                    animation: false
                }
            },
            tooltip: {
                shared: true,
                formatter: function() {
                    let tip = '<b>' + this.x.toFixed(2) + '</b>';
                    this.points.forEach(function(point) {
                        tip += '<br/>' + point.series.name + ': ' + point.y.toFixed(2) + ' V';
                    });

                    return tip;
                },
            },
            yAxis: {
                gridLineWidth: 1,
                tickAmount: 11,
            },
            xAxis: {
                //startOnTick: true,
                //endOnTick: true,

                gridLineWidth: 1,
                minorGridLineWidth: 0,
                tickPixelInterval: null,
                tickAmount: 11,
                
                /*
                tickPositioner: function() {
                    let xTicks = [this.position];
                    return xTicks;
                },
                */
                minorTickInterval: 'auto',
                minorTickLength: 10,
                minorTickWidth: 1,
                minorTickPosition: 'inside',
                
            },
            series: [
                {
                    name: 'Channel 0',
                    data: [],
                },
                /*
                {
                    name: 'Channel 1',
                    data: [],
                }
                */
            ]

        };
    }

    //Configure settings
    configure(sampleRate, numSamples, sigFreq, phaseOffset) {
        let url = 'https://0u7h6sgzf6.execute-api.us-east-1.amazonaws.com/prod';
        //let url = 'http://localhost:8080';

        let params = {
            "mode": "single",
            "sigType": "sin",
            "sampleRate": parseInt(sampleRate, 10),
            "numSamples": parseInt(numSamples, 10),
            "sigFreq": parseInt(sigFreq, 10),
            "phaseOffset": parseInt(phaseOffset, 10)
        };
        this.dataSource = this.http.post(url, JSON.stringify(params));
    }

    //Start acquisition
    start() {
        this.dataSourceSubscription = this.dataSource.subscribe(
            (result) => {
                console.log(result);
                this.frame++;
                let waveform = JSON.parse(result.text());
                this.drawWaveform(this.chart, 0, waveform);
            },
            (err) => {
                console.log('Data Source Error: ', err);
            },
            () => {
                if (this.run == true) {
                    this.start();
                }
                else {
                    console.log('Data Source Complete');
                }
            }
        );
    }

    //Stop acquisition if it is running
    stop() {
        this.run = false;
    }

    //Acquire single waveform
    single(sampleRate, numSamples, sigFreq, phaseOffset) {
        this.configure(sampleRate, numSamples, sigFreq, phaseOffset)

        this.run = false;
        this.start();
    }

    //Continuously acquire data
    continuous(sampleRate, numSamples, sigFreq, phaseOffset) {
        this.configure(sampleRate, numSamples, sigFreq, phaseOffset)

        this.run = true;
        this.start();
    }

    //Save a reference to the chart object so we can call methods on it later
    saveInstance(instance) {
        this.chart = instance;
    }

    //Update the chart data with the contents of a waveform object
    drawWaveform(chart, seriesNum, waveform) {        
        this.chart.series[seriesNum].options.pointStart = 0;//waveform.t0;
        this.chart.series[seriesNum].options.pointInterval = waveform.dt;
        this.chart.series[seriesNum].setData(waveform.y, true, false, false);
    }

    reflowChart() {
        this.chart.reflow();
    }

    xZoom(position, secsPerDiv) {
        position = parseFloat(position);
        secsPerDiv = parseFloat(secsPerDiv);
       
        let delta = 5 * secsPerDiv;
        let xMin = position - delta;
        let xMax = position + delta;
        
        this.chart.xAxis[0].setExtremes(xMin, xMax);
    }
}