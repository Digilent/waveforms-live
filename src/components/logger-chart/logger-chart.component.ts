import { Component, ViewChild } from '@angular/core';
import { Events } from 'ionic-angular';

//Pipes
import { UnitFormatPipe } from '../../pipes/unit-format.pipe';

//Services
import { LoggerPlotService } from '../../services/logger-plot/logger-plot.service';
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';

//Components
import { DigilentChart } from 'digilent-chart-angular2/modules';

@Component({
    selector: 'logger-chart',
    templateUrl: 'logger-chart.html'
})
export class LoggerChartComponent {
    @ViewChild('loggerChart') loggerChart: DigilentChart;
    private unitFormatPipeInstance: UnitFormatPipe;
    public colorArray: string[] = ['#FFA500', '#4487BA', '#ff3b99', '#00c864'];
    public loggerChartOptions: any;
    private activeDevice: DeviceService;
    private instrument: any;

    public unitSymbols: string[];

    constructor(
        private loggerPlotService: LoggerPlotService,
        private deviceManagerService: DeviceManagerService,
        private events: Events
    ) {
        this.unitFormatPipeInstance = new UnitFormatPipe();
        this.activeDevice = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
        this.instrument = this.activeDevice.instruments.logger.daq.numChans > 0 ? 'daq' : 'analog';
        
        // set the unit to v for volts initially
        let length = this.activeDevice.instruments.logger[this.instrument].numChans;
        this.unitSymbols = Array.from({length}, () => 'V');
        
        this.loggerChartOptions = this.generateBodeOptions();

        this.events.subscribe('units:update', (params) => {
            this.setChannelUnit(params[0]['channel'], params[0]['units']);
        });
    }

    ngOnDestroy() {
        this.events.unsubscribe('units:update');
    }

    setChannelUnit(chan: number, unit?: string) {
        this.unitSymbols[chan] = unit || 'V';

        this.loggerChartOptions = this.generateBodeOptions();
        
        this.loggerChart.flotOptions = this.loggerChartOptions;

        console.log(this.loggerChartOptions, this.loggerChart.flotOptions);
        console.log(this.unitSymbols, chan);

        this.loggerChart.digilentChart == undefined;
        this.loggerChart.createChart();
        this.loggerChart.chartLoad.emit();
    }

    plotLoaded() {
        console.log('chart loaded');
        console.log(this.loggerChart);

        this.loggerChart.digilentChart.setSecsPerDivArray(this.generateNiceNumArray(0.000001, 10));
        this.loggerChart.digilentChart.setVoltsPerDivArray(this.generateNiceNumArray(0.001, 5));
        this.loggerChart.digilentChart.setActiveXIndex(15);

        let analongChans =  this.activeDevice.instruments.logger[this.instrument].numChans;
        let indices = Array.from({length: analongChans}, () => 8);

        this.loggerChart.digilentChart.setActiveYIndices(indices);
        this.loggerPlotService.init(this.loggerChart);
    }

    generateNiceNumArray(min: number, max: number): number[] {
        let niceNumArray = [];
        let currentPow = Math.ceil(Math.log10(min));
        let current = min * Math.pow(10, -1 * currentPow);
        let i = 0;
        while (current * Math.pow(10, currentPow) <= max) {
            niceNumArray[i] = this.decimalAdjust('round', current * Math.pow(10, currentPow), currentPow);
            if (current === 1) {
                current = 2;
            }
            else if (current === 2) {
                current = 5;
            }
            else {
                current = 1;
                currentPow++;
            }
            i++;
        }
        return niceNumArray;
    }

    //Used to fix floating point errors when computing nicenumarray
    decimalAdjust(type, value, exp) {
        // If the exp is undefined or zero...
        if (typeof exp === 'undefined' || +exp === 0) {
            return Math[type](value);
        }
        value = +value;
        exp = +exp;
        // If the value is not a number or the exp is not an integer...
        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
            return NaN;
        }
        // Shift
        value = value.toString().split('e');
        value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
        // Shift back
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
    }

    generateBodeOptions() {
        let fftChartOptions = {
            series: {
                lines: {
                    show: true
                }
            },
            legend: {
                show: false
            },
            canvas: true,
            grid: {
                hoverable: true,
                clickable: true,
                autoHighlight: false,
                borderWidth: 0,
                backgroundColor: 'black',
                labelMargin: 15,
                margin: {
                    top: 15,
                    left: 10,
                    right: 28,
                    bottom: 10
                }
            },
            colors: this.colorArray,
            axisLabels: {
                show: true
            },
            tooltip: {
                show: true,
                cssClass: 'flotTip',
                content: (label, xval, yval, flotItem) => {
                    return (this.unitFormatPipeInstance.transform(xval, 's') + ' (' + this.unitFormatPipeInstance.transform(yval, 'V') + ')');
                },
                onHover: (flotItem, tooltipel) => {
                    let color = flotItem.series.color;
                    tooltipel[0].style.borderBottomColor = color;
                    tooltipel[0].style.borderTopColor = color;
                    tooltipel[0].style.borderLeftColor = color;
                    tooltipel[0].style.borderRightColor = color;
                }
            },
            cursorMoveOnPan: true,
            yaxes: this.generateFftYaxisOptions(),
            xaxis: {
                tickColor: '#666666',
                ticks: this.tickGenerator,
                tickFormatter: this.xTickFormatter,
                font: {
                    color: '#666666'
                }
            },
            zoomPan: {
                enabled: true,
                startingXIndex: 21
            }
        }
        return fftChartOptions;
    }

    generateFftYaxisOptions() {
        let fftYAxes: any = [];
        for (let i = 0; i < this.activeDevice.instruments.logger[this.instrument].numChans; i++) {
            let axisOptions = {
                position: 'left',
                axisLabel: 'Ch ' + (i + 1),
                axisLabelColour: '#666666',
                axisLabelUseCanvas: true,
                show: i === 0,
                tickColor: '#666666',
                ticks: this.tickGenerator,
                tickFormatter: this.yTickFormatter(this.unitSymbols[i]),
                font: {
                    color: '#666666'
                }
            }
            fftYAxes.push(axisOptions);
        }
        return fftYAxes;
    }

    tickGenerator(axis) {
        let min = axis.min;
        let max = axis.max;
        let interval = (max - min) / 10;
        let ticks = [];
        for (let i = 0; i < 11; i++) {
            ticks.push(i * interval + min);
        }
        return ticks;
    }

    /**
     * Accepts a symbol and returns a closure that constructs and formats the
     * value-unit string for the chart to use
     * 
     * @param symbol Symbol used to label y axis units
     */
    yTickFormatter(symbol) {
        return function(val, axis) {
            let vPerDiv = Math.abs(axis.max - axis.min) / 10;
            let i = 0;
            let unit = '';
            while (vPerDiv < 1) {
                i++;
                vPerDiv = vPerDiv * 1000;
            }
            val = (parseFloat(val) * Math.pow(1000, i)).toFixed(0);
            if (i == 0) {
                unit = ` ${symbol}`;
            }
            else if (i == 1) {
                unit = ` m${symbol}`;
            }
            else if (i == 2) {
                unit = ` u${symbol}`;
            }
            else if (i == 3) {
                unit = ` n${symbol}`;
            }
            return (val + unit);
        }
    }

    xTickFormatter(val, axis) {
        let timePerDiv = Math.abs(axis.max - axis.min) / 10;
        if (parseFloat(val) == 0) {
            return 0 + ' s';
        }
        let i = 0;
        let unit = '';
        while (timePerDiv < 1) {
            i++;
            timePerDiv = timePerDiv * 1000;
        }
        val = (parseFloat(val) * Math.pow(1000, i));
        let numDigits = val.toFixed(0).length;
        let fixedDigits;
        if (val < 0) {
            fixedDigits = numDigits < 5 ? 5 - numDigits : 0;
        }
        else {
            fixedDigits = numDigits < 4 ? 4 - numDigits : 0;
        }
        val = val.toFixed(fixedDigits);
        if (i == 0) {
            unit = ' s';
        }
        else if (i == 1) {
            unit = ' ms';
        }
        else if (i == 2) {
            unit = ' us';
        }
        else if (i == 3) {
            unit = ' ns';
        }
        else if (i == 4) {
            unit = ' ps';
        }
        return val + unit;
    }

}