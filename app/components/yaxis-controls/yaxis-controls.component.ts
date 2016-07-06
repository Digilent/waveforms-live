import {Component, Output, EventEmitter, Input} from '@angular/core';

//Components
import {SilverNeedleChart} from '../chart/chart.component';

@Component({
  templateUrl: 'build/components/yaxis-controls/yaxis-controls.html',
  selector: 'yaxis-controls',
})
export class YAxisComponent {
    @Input() chart: SilverNeedleChart;
    private numSeries: number[] = [0, 1];
    
    constructor() {
    }

    seriesChanged(seriesNum: number) {
        this.chart.setSeriesSettings({
            seriesNum: seriesNum,
            voltsPerDiv: this.chart.voltDivision[seriesNum],
            voltBase: this.chart.voltBase[seriesNum]
        });
    }

    setActiveSeries(i) {
        this.chart.setActiveSeries(i + 1);
    }

    autoscaleY(i) {
        this.chart.autoscaleAxis('y', i);
        console.log(this.chart.voltBase, this.chart.voltDivision);
    }
}