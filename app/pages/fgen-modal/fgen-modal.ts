import {IONIC_DIRECTIVES, Page, NavParams, ViewController, Platform} from 'ionic-angular';
import {ViewChild} from 'angular2/core';

//Components
import {SilverNeedleChart} from '../../components/chart/chart.component';

@Page({
    templateUrl: "build/pages/fgen-modal/fgen-modal.html",
    directives: [IONIC_DIRECTIVES, SilverNeedleChart]
})
export class ModalFgenPage {
    @ViewChild('chart') chart: SilverNeedleChart;
    private platform: Platform;
    private viewCtrl: ViewController;
    private params: NavParams;
    private showDutyCycle: boolean;
    private waveType: string;
    private frequency: number;
    private amplitude: number;
    private offset: number;
    private dutyCycle: number;
    private newChart: any;
    
    public value: number;
    
    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams
    ) {
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.value = this.params.get('value');
        this.showDutyCycle = false;
        this.waveType = 'sine';
        this.frequency = 1000;
        this.amplitude = 2.5;
        this.offset = 2.5;
        this.dutyCycle = 50;
    }

    closeModal() {
        console.log(this.value);
        this.viewCtrl.dismiss(10);
    }
    
    isDigiWave() {
        if (this.waveType === 'digitalWave') {
            return true;
        }
        return false;
    }
    
    saveInstance(chart: Object) {
        alert('swwag');
        console.log(chart);
        this.newChart = chart;
        console.log(this.chart);
        this.chart.chart.options.series.data = [5, 5, 5, 5];
        this.chart.chart.reflow();
    }
}