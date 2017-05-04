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
    public ignoreFocusOut: boolean = false;

    constructor(public tooltipService: TooltipService) { }

    checkForEnter(event) {
        if (event.key === 'Enter') {
            this.formatInputAndUpdate(event);
            this.ignoreFocusOut = true;
        }
    }

    inputLeave(event) {
        if (!this.ignoreFocusOut) {
            this.formatInputAndUpdate(event);
        }
        this.ignoreFocusOut = false;
    }

    formatInputAndUpdate(event) {
        let value: string = event.target.value;
        let parsedValue: number = parseFloat(value);

        let trueValue: number = parsedValue;
        if (value.indexOf('G') !== -1) {
            trueValue = parsedValue * Math.pow(10, 9);
        }
        else if (value.indexOf('M') !== -1) {
            trueValue = parsedValue * Math.pow(10, 6);
        }
        else if (value.indexOf('k') !== -1 || value.indexOf('K') !== -1) {
            trueValue = parsedValue * Math.pow(10, 3);
        }
        else if (value.indexOf('m') !== -1) {
            trueValue = parsedValue * Math.pow(10, -3);
        }
        else if (value.indexOf('u') !== -1) {
            trueValue = parsedValue * Math.pow(10, -6);
        }
        else if (value.indexOf('n') !== -1) {
            trueValue = parsedValue * Math.pow(10, -9);
        }

        if (trueValue > Math.pow(10, 9)) {
            trueValue = Math.pow(10, 9);
        }
        else if (trueValue < -Math.pow(10, 9)) {
            trueValue = -Math.pow(10, 9);
        }
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