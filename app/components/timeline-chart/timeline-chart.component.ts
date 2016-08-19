import {Component, Output, Input, EventEmitter, ElementRef, ViewChild} from '@angular/core';
import {CHART_DIRECTIVES} from 'angular2-highcharts';
import {NgClass} from '@angular/common';

@Component({
    selector: 'timeline-chart',
    directives: [CHART_DIRECTIVES, NgClass],
    templateUrl: 'build/components/timeline-chart/timeline-chart.html',
})
export class TimelineChartComponent {
    @Output() timelineChartLoad: EventEmitter<any> = new EventEmitter();
    @Output() timelineChartEvent: EventEmitter<any> = new EventEmitter();
    @ViewChild('timelineChartInner') timelineChartInner: ElementRef;
    private timelineOptions: Object;
    private chart: Object;

    constructor() {
        this.timelineOptions = {
            chart: {
                type: 'line',
                zoomType: '',
                title: '',
                animation: false
            },
            title: {
                text: null
            },
            tooltip: {
                enabled: false
            },
            series: [{
                data: [29.9, 36, 47, 57, 67, 71.5, 82, 92, 102, 106.4, 110, 120, 129.2],
            }, {
                data: [50, 60, 70, 80],
                yAxis: 0
            }],
            legend: {
                enabled: false
            },
            yAxis: [{
                offset: 0,
                title: {
                    text: null
                },
                labels: {
                    enabled: false
                }
            }, {
                offset: 0,
                title: {
                    text: null
                },
                labels: {
                    enabled: false
                }
            }],
            credits: {
                enabled: false
            },
            xAxis: {
                labels: {
                    enabled: false
                },
                tickWidth: 0,
                plotBands: [{
                    color: 'rgba(182,191,190,0.5)',
                    from: 0,
                    to: 0,
                    id: 'plot-band-1'
                },{
                    color: 'rgba(182,191,190,0.5)',
                    from: 0,
                    to: 0,
                    id: 'plot-band-2'
                }],
                plotLines: [{
                    value: 0,
                    color: 'rgba(182,191,190,0.5)',
                    width: 10,
                    id: 'left',
                    zIndex: 100
                }, {
                    value: 0,
                    color: 'rgba(182,191,190,0.5)',
                    width: 10,
                    id: 'right',
                    zIndex: 100
                }]
            },
            plotOptions: {
                series: {
                    pointInterval: 2,
                    pointStart: 0,
                    stickyTracking: false,
                    states: {
                        hover: {
                            enabled: false
                        }
                    }
                },
                line: {
                    marker: {
                        enabled: false
                    }
                }
            }
        };
    }

    //Called on timeline chart load
    onTimelineLoad(chartInstance) {
        this.chart = chartInstance;
        this.timelineChartLoad.emit(this);
    }

    timelineChartEventExporter(event, type: string) {
        this.timelineChartEvent.emit({
            ev: event, 
            type: type
        });
    }

}