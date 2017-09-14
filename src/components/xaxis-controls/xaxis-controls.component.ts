import { Component, Input } from '@angular/core';

//Components
import { SilverNeedleChart } from '../chart/chart.component';

//Services
import { TooltipService } from '../../services/tooltip/tooltip.service';

@Component({
    templateUrl: 'xaxis-controls.html',
    selector: 'xaxis-controls'
})
export class XAxisComponent {
    @Input() chart: SilverNeedleChart;
    public timePerDiv: string;
    public base: string;
    public showTimeSettings: boolean = true;

    constructor(public tooltipService: TooltipService) { }

    valChange(trueValue) {
        console.log(trueValue);
        if (trueValue < this.chart.secsPerDivVals[0]) {
            trueValue = this.chart.secsPerDivVals[0];
        }
        else if (trueValue > this.chart.secsPerDivVals[this.chart.secsPerDivVals.length - 1]) {
            trueValue = this.chart.secsPerDivVals[this.chart.secsPerDivVals.length - 1];
        }
        if (this.chart.timeDivision === trueValue) {
            console.log('the same');
            this.chart.timeDivision = trueValue * 10 + 1;
            setTimeout(() => {
                this.chart.timeDivision = trueValue;
            }, 1);
            return;
        }
        this.chart.timeDivision = trueValue;
        this.chart.setNearestPresetSecPerDivVal(trueValue);

        this.chart.setTimeSettings({
            timePerDiv: this.chart.timeDivision,
            base: this.chart.base
        }, false);
    }

    //Called when time settings are changed. Update chart component with new settings and call setTimeSettings
    timeChanged() {
        this.chart.base = parseFloat(this.chart.base.toString());
        this.chart.setTimeSettings({
            timePerDiv: this.chart.timeDivision,
            base: this.chart.base
        }, false);
    }

    //Call chart autoscale on the x axis
    autoscaleX() {
        this.chart.autoscaleAxis('x', 0);
    }

    //Toggle Series visibility
    toggleSeriesSettings() {
        this.showTimeSettings = !this.showTimeSettings;
    }
}