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
            plotOptions: {
                series: {
                    animation: {
                        animation: false
                    }
                }
            },
            tooltip: {
                shared: true,
                formatter: function() {
                    let tip = '<b>' + this.x.toFixed(2) + '</b>';
                    this.points.forEach(function(point) {
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
        console.log(waveform.t0);
        chart.series[seriesNum].options.pointStart = waveform.t0;
        chart.series[seriesNum].options.pointInterval = waveform.dt / 1000;
        chart.series[seriesNum].setData(waveform.y, true, false, false);
    }

    reflowChart() {
        this.chart.reflow();
    }

    /*
        single(sampleRate, numSamples, sigFreq, phaseOffset) {
    
            let url = 'https://0u7h6sgzf6.execute-api.us-east-1.amazonaws.com/prod';
            let params = {
                "mode": "single",
                "sigType": "sin",
                "sampleRate": parseInt(sampleRate, 10),
                "numSamples": parseInt(numSamples, 10),
                "sigFreq": parseInt(sigFreq, 10),
                "phaseOffset": parseInt(phaseOffset, 10)
            };
    
            this.http.post(url, JSON.stringify(params)).subscribe((response) => {
                if (response.status != 200) {
                    console.log(Error, 'Bad Response: ', response);
                }
                else {
                    let waveform = JSON.parse(response.text());
    
                    this.drawWaveform(this.chart, 0, waveform);
                    this.count++;
                }
            });
        }
    
    
    
    
    
    
    
    
    
        /*
            continuous(sampleRate, numSamples, sigFreq, phaseOffset) {
                let url = 'https://0u7h6sgzf6.execute-api.us-east-1.amazonaws.com/prod';
                let params = {
                    "mode": "single",
                    "sigType": "sin",
                    "sampleRate": parseInt(sampleRate, 10),
                    "numSamples": parseInt(numSamples, 10),
                    "sigFreq": parseInt(sigFreq, 10),
                    "phaseOffset": parseInt(phaseOffset, 10)
                };
                
                this.http.post(url, JSON.stringify(params)).subscribe((response) => {
                    if (response.status != 200) {
                        console.log(Error, 'Bad Response: ', response);
                    }
                    else {
                        let waveform = JSON.parse(response.text());
                        this.drawWaveform(this.chart, 0, waveform);
                    }
                })
            }
            */
}