import { Component, Output, Input, EventEmitter } from '@angular/core';

//Interfaces
import { Chart } from '../chart/chart.interface';

//Pipes
import { UnitFormatPipe } from '../../pipes/unit-format.pipe';

declare var $: any;

@Component({
    selector: 'bode-plot',
    templateUrl: 'bode-plot.html'
})

export class BodePlotComponent {
    @Output() chartLoad: EventEmitter<any> = new EventEmitter();
    public unitFormatPipeInstance = new UnitFormatPipe();
    public bodeChart: Chart;

    constructor() { }

    ngAfterViewInit() {
        
    }
}
