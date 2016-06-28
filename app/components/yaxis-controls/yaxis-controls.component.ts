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
        this.voltsPerDiv = ['11','3'];
        this.voltBase = ['78', '65'];
    }

    seriesChanged(seriesNum: number) {
        this.chart.setSeriesSettings({
            seriesNum: seriesNum,
            voltsPerDiv: parseFloat(this.voltsPerDiv[seriesNum]),
            voltBase: parseFloat(this.voltBase[seriesNum])
        });
    }

    setActiveSeries(i) {
        this.chart.setActiveSeries(i + 1);
    }
}