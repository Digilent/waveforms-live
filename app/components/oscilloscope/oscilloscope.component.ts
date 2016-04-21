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

    public frameNumber: number = 0;
    private dataSource: Observable<any>;
    private dataSourceSubscription: any;
    public run: boolean = false;

    //Chart Pan / Zoom Variables
    public xPosition = 5;
    public xUnitsPerDiv = 1;
    public yPosition = 0;
    public yUnitsPerDiv = 1;

    //Cursors
    public numXCursors: number = 0;

    constructor(private http: Http) {
        this.sampleRate = 10000;
        this.numSamples = 100;
        this.sigFreq = 200;
        this.phaseOffset = 0;

        this.options = {
            chart: {
                type: 'line',
                zoomType: '',
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
                formatter: function () {
                    let tip = '<b>' + this.x.toFixed(2) + '</b>';
                    this.points.forEach(function (point) {
                        tip += '<br/>' + point.series.name + ': ' + point.y.toFixed(2) + ' V';
                    });

                    return tip;
                },
            },
            yAxis: {
                gridLineWidth: 1,
                tickPositioner: function () {
                    let numTicks = 11;
                    let ticks = [];
                    let min = this.chart.yAxis[0].min;
                    let max = this.chart.yAxis[0].max;
                    let delta = (max - min) / (numTicks - 1);
                    for (var i = 0; i < numTicks; i++) {
                        ticks[i] = (min + i * delta).toFixed(3);
                    }
                    return ticks;
                },
            },
            xAxis: {
                startOnTick: true,
                endOnTick: true,

                gridLineWidth: 1,
                minorGridLineWidth: 0,

                tickPositioner: function () {
                    let numTicks = 11;
                    let ticks = [];
                    let min = this.chart.xAxis[0].min;
                    let max = this.chart.xAxis[0].max;
                    let delta = (max - min) / (numTicks - 1);
                    for (var i = 0; i < numTicks; i++) {
                        ticks[i] = (min + i * delta).toFixed(3);
                    }
                    return ticks;
                },

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
        //let url = 'https://0u7h6sgzf6.execute-api.us-east-1.amazonaws.com/prod';
        let url = 'http://localhost:8080';

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
                //console.log(result);
                this.frameNumber++;
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

   
    onLoad(instance) {
         //Save a reference to the chart object so we can call methods on it later
        this.chart = instance;
        this.setXView(this.xPosition, this.xUnitsPerDiv);
        this.setYView(this.yPosition, this.yUnitsPerDiv);
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

    setXView(position, secsPerDiv) {
        position = parseFloat(position);
        secsPerDiv = parseFloat(secsPerDiv);

        let delta = 5 * secsPerDiv;
        let min = position - delta;
        let max = position + delta;

        this.chart.xAxis[0].setExtremes(min, max);
    }

    xViewChange(position, unitsPerDiv) {
        this.xPosition = position;
        this.xUnitsPerDiv = unitsPerDiv;
        this.setXView(position, unitsPerDiv);
    }

    setYView(position, secsPerDiv) {
        position = parseFloat(position);
        secsPerDiv = parseFloat(secsPerDiv);

        let delta = 5 * secsPerDiv;
        let min = position - delta;
        let max = position + delta;

        this.chart.yAxis[0].setExtremes(min, max);
    }

    yViewChange(position, unitsPerDiv) {
        this.yPosition = position;
        this.yUnitsPerDiv = unitsPerDiv;
        this.setYView(position, unitsPerDiv);
    }
}