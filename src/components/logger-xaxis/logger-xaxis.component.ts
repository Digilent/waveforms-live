import { Component, Input, Output, EventEmitter } from '@angular/core';

//Components
import { SilverNeedleChart } from '../chart/chart.component';

//Services
import { TooltipService } from '../../services/tooltip/tooltip.service';

@Component({
    templateUrl: 'logger-xaxis.html',
    selector: 'logger-xaxis'
})
export class LoggerXAxisComponent {
    @Input('tpdArray') tpdArray: number[];
    @Input('tpdIndex') tpdIndex: number;
    @Input('tpdAbsolute') tpdAbsolute: number;
    @Output('tpdChange') tpdChange: EventEmitter<number> = new EventEmitter<number>();
    public timePerDiv: string;
    public base: string;
    public showTimeSettings: boolean = true;

    constructor(public tooltipService: TooltipService) { 
        console.log('logger xaxis constructor'); 
        setTimeout(() => {
            console.log('checking tpd info');
            console.log('arr, ind, abs');
            console.log(this.tpdAbsolute);
            console.log(this.tpdIndex);
            console.log(this.tpdAbsolute);
        }, 5000);
    }

    valChange(trueValue) {
        console.log(trueValue);
        if (trueValue < this.tpdArray[0]) {
            trueValue = this.tpdArray[0];
        }
        else if (trueValue > this.tpdArray[this.tpdArray.length - 1]) {
            trueValue = this.tpdArray[this.tpdArray.length - 1];
        }
        if (this.tpdAbsolute === trueValue) {
            console.log('the same');
            /* this.chart.timeDivision = trueValue * 10 + 1;
            setTimeout(() => {
                this.chart.timeDivision = trueValue;
            }, 1); */
            return;
        }
        /* this.chart.timeDivision = trueValue;
        this.chart.setNearestPresetSecPerDivVal(trueValue);

        this.chart.setTimeSettings({
            timePerDiv: this.chart.timeDivision,
            base: this.chart.base
        }, false); */
        this.tpdChange.emit(trueValue);
    }

    incrementTpd() {
        this.tpdChange.emit(this.tpdArray[this.tpdIndex + 1]);
    }

    decrementTpd() {
        this.tpdChange.emit(this.tpdArray[this.tpdIndex - 1]);
    }

    //Toggle Series visibility
    toggleSeriesSettings() {
        this.showTimeSettings = !this.showTimeSettings;
    }
}