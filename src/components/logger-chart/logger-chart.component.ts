import { Component, ViewChild } from '@angular/core';

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
    public loggerChartOptions: any = this.generateBodeOptions();
    private activeDevice: DeviceService;

    constructor(
        private loggerPlotService: LoggerPlotService,
        private deviceManagerService: DeviceManagerService
    ) {
        this.unitFormatPipeInstance = new UnitFormatPipe();
        this.activeDevice = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
    }

    panEvent() {
        console.log('pan');
    }

    plotLoaded() {
        console.log('chart loaded');
        console.log(this.loggerChart);
        this.loggerChart.digilentChart.setSecsPerDivArray(this.generateNiceNumArray(0.000001, 10));
        this.loggerChart.digilentChart.setVoltsPerDivArray(this.generateNiceNumArray(0.001, 5));
        this.loggerChart.digilentChart.setActiveXIndex(15);
        this.loggerChart.digilentChart.setActiveYIndices([10, 10]);
        console.log(this.loggerChart);
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
                font: {
                    color: '#666666'
                }
            },
            zoomPan: {
                enabled: true,
                startingXIndex: 21
            }
        }
        console.log(fftChartOptions);
        return fftChartOptions;
    }

    generateFftYaxisOptions() {
        let fftYAxes: any = [];
        for (let i = 0; i < 2/* this.activeDevice.instruments.logger.numChans */; i++) {
            let axisOptions = {
                position: 'left',
                axisLabel: 'Ch ' + (i + 1),
                axisLabelColour: '#666666',
                axisLabelUseCanvas: true,
                show: i === 0,
                tickColor: '#666666',
                font: {
                    color: '#666666'
                }
            }
            fftYAxes.push(axisOptions);
        }
        return fftYAxes;
    }

}