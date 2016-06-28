import {Component, Output, EventEmitter, Input} from '@angular/core';

//Components
import {SilverNeedleChart} from '../chart/chart.component';

@Component({
  templateUrl: 'build/components/yaxis-controls/yaxis-controls.html',
  selector: 'yaxis-controls',
})
export class YAxisComponent {
    @Input() chart: SilverNeedleChart;
    private voltsPerDiv: string[];
    private voltBase: string[];
    private numSeries: number[] = [0, 1];
    
    constructor() {
        this.voltsPerDiv = ['10','5'];
        this.voltBase = ['50', '12'];
    }

    seriesChanged(seriesNum: number) {
        this.chart.setSeriesSettings({
            seriesNum: seriesNum,
            voltsPerDiv: parseFloat(this.voltsPerDiv[seriesNum]),
            voltBase: parseFloat(this.voltBase[seriesNum])
        });
    }
}