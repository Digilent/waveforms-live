import {Component, ViewChild, ElementRef} from 'angular2/core';
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
    @ViewChild('oscopeChartInner') oscopeChartInner: ElementRef;
    @ViewChild('chartContainer') chartContainer: ElementRef;

    private chart: Object;
    private options: Object;
    private data: Array<number>;

    public sampleRate: number;
    public numSamples: number;
    public sigFreq: number;
    public phaseOffset: number;

    public frameNumber: number = 0;
    public remoteDataSource: boolean;
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
    private xCursorDragStartPos: number = 0;
    private xCursors;
    private cursorLabel: any;

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
                animation: false,
                /*
                 events: {
                     click: function (event) {
                         console.log(event.xAxis[0].value);
                     }
                 }
                 */

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
                enabled: false,
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

    toggleDataSource() {
        if (this.source == "Remote") {
            this.source = "Local";
        }
        else {
            this.source = "Remote";
        }
    }
    //Configure settings
    configure(sampleRate, numSamples, sigFreq, phaseOffset) {
        if (this.remoteDataSource) {
            let url = 'https://0u7h6sgzf6.execute-api.us-east-1.amazonaws.com/prod';
        }
        else {
            let url = 'http://localhost:8080';
        }

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

    yViewChange(position: number, unitsPerDiv: number) {
        this.yPosition = position;
        this.yUnitsPerDiv = unitsPerDiv;
        this.setYView(position, unitsPerDiv);
    }


    //-------------------- Cursors --------------------
    addCursor() {
        this.chart.xAxis[0].addPlotLine({
            value: this.xPosition,
            color: 'blue',
            width: 3,
            zIndex: 100 + this.numXCursors,
            id: 'cursor' + this.numXCursors,
        });

        this.cursorLabel = this.chart.renderer.text('Cursor 0', 100, 100).add();

        //let options = this.chart.options;
        //console.log(options);
        this.chart.options.chart.events.click = function (event) {
            console.log(event);
        };
        console.log(this.chart.options);
        //this.chart = new Highcharts.Chart(options);

        //Set Mouse To Pointer On Hover Over
        this.chart.xAxis[0].plotLinesAndBands[0].svgElem.css({
            'cursor': 'pointer'
        })

            .on('mousedown', (event) => {
                // console.log('start')
                this.xCursorDragStartPos = event.clientX;
                this.xCursorStartDrag(0, event.clientX);
            })
            .on('mouseup', (event) => {
                console.log('mouse released on cursor');
                //console.log('stop')
            });

        this.numXCursors++;
    }

    xCursorStartDrag(cursorId, xStartPos) {
        console.log('start');
        console.log(this.oscopeChartInner);
        this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.cursorDragListener);
        this.oscopeChartInner.nativeElement.addEventListener('mouseup', this.xCursorStopDrag.bind(this));
    }

    xCursorStopDrag() {
        this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.cursorDragListener);
        console.log('done');
        //console.log(this.chart.xAxis[0].plotLinesAndBands[0].options.value);

    }

    //
    cursorDragListener = function (event) {
        //TODO FORCE BETWEEN MIN / MAX
        let xVal = this.chart.xAxis[0].translate(event.layerX - this.chart.plotLeft, true).toFixed(1);
        console.log(this.chart.series[0].data[0].x);       
        let pointNum = Math.round((xVal - this.chart.series[0].data[0].x) / this.chart.series[0].options.pointInterval);
        //console.log(this.chart.series[0].data[pointNum].plotY + 15);
        //this.chart.xAxis[0].plotLinesAndBands[0].svgElem.translate(event.clientX - this.xCursorDragStartPos);
        this.chart.xAxis[0].plotLinesAndBands[0].options.value = xVal;
        this.chart.xAxis[0].plotLinesAndBands[0].render();
        this.cursorLabel.attr({
            text: this.chart.series[0].data[pointNum].y.toFixed(3) + 'V', 
            x: event.chartX + 5,
            y: this.chart.series[0].data[pointNum].plotY - 15
        });
    }.bind(this);
    
    redrawChart()
    {
        this.chart.reflow();
    }
}