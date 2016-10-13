import {Component, EventEmitter, Input} from '@angular/core';

//Components
import {SilverNeedleChart} from '../chart/chart.component';

@Component({
  templateUrl: 'xaxis-controls.html',
  selector: 'xaxis-controls'
})
export class XAxisComponent {
    @Input() chart: SilverNeedleChart;
    public timePerDiv: string;
    public base: string;
    public storageEventListener: EventEmitter<any>;
    public showTimeSettings: boolean = true;
    
    constructor() {
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
    toggleSeriesSettings(seriesNum: number) {
        this.showTimeSettings = !this.showTimeSettings;
    }
}