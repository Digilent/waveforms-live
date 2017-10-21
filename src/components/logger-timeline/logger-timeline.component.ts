import { Component, ViewChild } from '@angular/core';

//Pipes
import { UnitFormatPipe } from '../../pipes/unit-format.pipe';

//Services
import { LoggerPlotService } from '../../services/logger-plot/logger-plot.service';
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';

//Components
import { DigilentChart } from 'digilent-chart-angular2/modules';

@Component({
    selector: 'logger-timeline',
    templateUrl: 'logger-timeline.html'
})
export class LoggerTimelineComponent {
    @ViewChild('loggerTimeline') loggerTimeline: DigilentChart;
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

    plotLoaded() {
        console.log('chart loaded');
        console.log(this.loggerTimeline);
        /* this.loggerTimeline.digilentChart.setSecsPerDivArray(this.generateNiceNumArray(0.000001, 10));
        this.loggerTimeline.digilentChart.setVoltsPerDivArray(this.generateNiceNumArray(0.001, 5));
        this.loggerTimeline.digilentChart.setActiveXIndex(15);
        this.loggerTimeline.digilentChart.setActiveYIndices([8, 8]); */
        this.loggerPlotService.setTimelineRef(this.loggerTimeline);
    }

    generateBodeOptions() {
        let fftChartOptions = {
            series: {
                lines: {
                    show: true
                },
                downsample: {
                    threshold: 1000
                }
            },
            timelineChart: {
                enabled: true,
                updateExistingChart: true
            },
            legend: {
                show: false
            },
            cursors: [],
            grid: {
                hoverable: true,
                clickable: true,
                autoHighlight: false,
                borderWidth: 0,
                backgroundColor: 'black',
                margin: {
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0
                }
            },
            colors: this.colorArray,
            yaxis: {
                ticks: []
            },
            xaxis: {
                ticks: []
            }
        };
        console.log(fftChartOptions);
        return fftChartOptions;
    }

}