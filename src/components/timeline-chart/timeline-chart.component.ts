import {Component, Output, EventEmitter, ElementRef, ViewChild} from '@angular/core';

@Component({
    selector: 'timeline-chart',
    templateUrl: 'timeline-chart.html'
})
export class TimelineChartComponent {
    @Output() timelineChartLoad: EventEmitter<any> = new EventEmitter();
    @Output() timelineChartEvent: EventEmitter<any> = new EventEmitter();
    @ViewChild('timelineChartInner') timelineChartInner: ElementRef;
    public timelineOptions: Object;
    public chart: Object;

    constructor() {}

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