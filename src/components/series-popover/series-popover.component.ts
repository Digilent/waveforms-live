import { Component } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';

//Components
import { SilverNeedleChart } from '../chart/chart.component';
import { YAxisComponent } from '../yaxis-controls/yaxis-controls.component';

@Component({
    templateUrl: 'series-popover.html'
})

export class SeriesPopover {
    public chart: SilverNeedleChart;
    public yControls: YAxisComponent;
    public seriesNum: number;
    public colorPickerRef: HTMLElement

    constructor(
        public viewCtrl: ViewController,
        public params: NavParams
    ) {
        this.yControls = this.params.get('yComponent');
        this.chart = this.params.get('chart');
        this.seriesNum = this.params.get('seriesNum');
    }

    ngOnInit() {
        this.colorPickerRef = document.getElementById('color-picker');
    }

    //Close popover and send option string as a NavParam
    close(option: string) {
        this.viewCtrl.dismiss({
            option: option
        });
    }

    openColorPicker(event) {
        this.colorPickerRef.addEventListener('input', (event: any) => {
            this.chart.chart.series[this.seriesNum].update({
                color: event.target.value
            }, true);
            if (this.chart.timelineView) {
                this.chart.timelineChart.series[this.seriesNum].update({
                    color: event.target.value
                }, true);
            }
            if (this.chart.seriesAnchors[this.seriesNum] !== undefined) {
                this.chart.seriesAnchors[this.seriesNum].attr({
                    fill: event.target.value
                });
            }
        });
        this.colorPickerRef.click();
    }
}