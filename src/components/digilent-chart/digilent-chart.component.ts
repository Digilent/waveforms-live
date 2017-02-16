import { Component, Output, Input, EventEmitter, trigger, state, style, transition, animate } from '@angular/core';

//Interfaces
import { Chart, DataContainer } from '../chart/chart.interface';

//Pipes
import { UnitFormatPipe } from '../../pipes/unit-format.pipe';

declare var $: any;

@Component({
    selector: 'digilent-chart',
    templateUrl: 'digilent-chart.html',
    animations: [
        trigger('expand', [
            state('true', style({ height: '100%' })),
            state('false', style({ height: '0%' })),
            transition('void => *', animate('0s')),
            transition('* <=> *', animate('250ms ease-in-out'))
        ])
    ]
})

export class DigilentChart {
    @Output() chartLoad: EventEmitter<any> = new EventEmitter();
    @Input() chartId: string;
    @Input() flotOptions: any;
    @Input() chartType: 'standard'|'log'|'semilogX'|'semilogY';
    public unitFormatPipeInstance = new UnitFormatPipe();
    public chart: Chart;
    

    constructor() { }

    ngAfterViewInit() {
        console.log('View Init');
        let plotArea = $('#' + this.chartId);
        plotArea.css({
            width: '100%',
            height: '100%'
        });
        if (this.chart == undefined) {
            this.createChart();
        }
    }

    

    createChart() {
        console.log('creating digilent chart');
        console.log('generated options');
        console.log('chart id::::::::');
        console.log(this.chartId);
        if (this.chartId == undefined || this.flotOptions == undefined) {
            setTimeout(() => {
                this.createChart();
            }, 20);
            return;
        }
        this.chart = $.plot("#" + this.chartId, [], this.flotOptions);
    }

    setData(dataToDraw: DataContainer[]) {
        this.chart.setData(dataToDraw);
        this.chart.setupGrid();
        this.chart.draw();
    }

    refreshChart() {
        this.createChart();
    }
}
