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
    public colorPickerRef: HTMLElement;

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

    ngOnInit() {
        this.colorPickerRef = document.getElementById('color-picker');
    }

    
    //Export series as csv with file name 'myData'
    exportChart() {
        this.chart.exportCsv('myData');
    }

    openColorPicker(event) {
        this.colorPickerRef.addEventListener('input', (event: any) => {
            this.chart.chart.series[0].update({
                color: event.target.value
            }, true);
            if (this.chart.timelineView) {
                this.chart.timelineChart.series[0].update({
                    color: event.target.value
                }, true);
            }
            if (this.chart.seriesAnchors[0] !== undefined) {
                this.chart.seriesAnchors[0].attr({
                    fill: event.target.value
                });
            }
        });
        this.colorPickerRef.click();
    }

    close() {
        this.viewCtrl.dismiss();
    }
    
}