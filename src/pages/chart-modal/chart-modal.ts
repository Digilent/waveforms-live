import {NavParams, ViewController, Platform} from 'ionic-angular';
import {Component} from '@angular/core';

//Components
import {SilverNeedleChart} from '../../components/chart/chart.component';

@Component({
    templateUrl: "chart-modal.html"
})

export class ChartModalPage {
    public chartComponent: SilverNeedleChart;
    public platform: Platform;
    public viewCtrl: ViewController;
    public params: NavParams;
    public chart: SilverNeedleChart;

    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams
    ) {
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.chart = this.params.get('chartComponent');
    }

    
    //Export series as csv with file name 'myData'
    exportChart() {
        this.chart.exportCsv('myData');
    }

    close() {
        this.viewCtrl.dismiss();
    }
    
}