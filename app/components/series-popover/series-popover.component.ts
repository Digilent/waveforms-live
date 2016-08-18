import {Component} from '@angular/core';
import {ViewController, NavParams} from 'ionic-angular';

//Components
import {SilverNeedleChart} from '../chart/chart.component';
import {YAxisComponent} from '../yaxis-controls/yaxis-controls.component';

@Component({
  templateUrl: 'build/components/series-popover/series-popover.html'
})

export class SeriesPopover {
    private chart: SilverNeedleChart;
    private yControls: YAxisComponent;
    private seriesNum: number;

    constructor(
        private viewCtrl: ViewController, 
        private params: NavParams
    ) {
        this.yControls = this.params.get('yComponent');
        this.chart = this.params.get('chart');
        this.seriesNum = this.params.get('seriesNum');
    }

    //Close popover and send option string as a NavParam
    close(option: string) {
        this.viewCtrl.dismiss({
            option: option
        });
    }
}