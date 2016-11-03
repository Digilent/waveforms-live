import {Component, EventEmitter, Input} from '@angular/core';
import {NavParams, ViewController, PopoverController} from 'ionic-angular';

//Components
import {SilverNeedleChart} from '../chart/chart.component';
import {SeriesPopover} from '../series-popover/series-popover.component';

@Component({
    templateUrl: 'yaxis-controls.html',
    selector: 'yaxis-controls'
})
export class YAxisComponent {
    @Input() chart: SilverNeedleChart;
    public numSeries: number[] = [0, 1];
    public storageEventListener: EventEmitter<any>;
    public viewCtrl: ViewController;
    public params: NavParams;
    public popoverCtrl: PopoverController;
    public names: string[] = [];
    public showSeriesSettings: boolean[] = [];
    public configHover: boolean = false;
    public timeoutRef: any;
    public showOscSettings: boolean = true;
    
    constructor(_viewCtrl: ViewController, _params: NavParams, _popoverCtrl: PopoverController) {
        this.popoverCtrl = _popoverCtrl;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
    }

    ngOnInit() {
        for (let i = 0; i < this.chart.oscopeChansActive.length; i++) {
            this.names.push('Osc ' + (i + 1));
            this.showSeriesSettings.push(this.chart.oscopeChansActive[i]);
        }
    }

    getSeriesColor(seriesNum: number) {
        if (this.chart.chart.series[seriesNum].visible) {
            return this.chart.getSeriesColor(seriesNum);
        }
        return '#535353';
    }

    getSeriesFontColor(seriesNum: number) {
        if (this.chart.chart.series[seriesNum].visible) {
            return '#535353';
        }
        return 'white';
    }

    toggleOscSettings() {
        this.showOscSettings = !this.showOscSettings;
    }

    //Toggle Series visibility
    toggleSeriesSettings(seriesNum: number) {
        console.log('toggle series settings' + seriesNum);
        this.showSeriesSettings[seriesNum] = !this.showSeriesSettings[seriesNum];
    }

    toggleVisibility(seriesNum: number, event) {
        event.stopPropagation();
        this.chart.toggleVisibility(seriesNum);
    }

    //Open series popover
    openSeriesPopover(seriesNum) {
        let popover = this.popoverCtrl.create(SeriesPopover, {
            chart: this.chart,
            yComponent: this,
            seriesNum: seriesNum
        });

        popover.present({
            ev: event
        });
    }

    //Called when series settings are changed. Updates chart series settings
    seriesChanged(seriesNum: number) {
        this.chart.setSeriesSettings({
            seriesNum: seriesNum,
            voltsPerDiv: this.chart.voltDivision[seriesNum],
            voltBase: this.chart.voltBase[seriesNum]
        });
    }

    //Set active series on the chart component
    setActiveSeries(i) {
        this.chart.setActiveSeries(i + 1);
    }

    //Autoscale a specific y axis
    autoscaleY(i) {
        this.chart.autoscaleAxis('y', i);
    }
}