import {IONIC_DIRECTIVES, Page, NavParams, ViewController, Platform} from 'ionic-angular';
import {ViewChild} from 'angular2/core';

//Components
import {SilverNeedleChart} from '../../components/chart/chart.component';

@Page({
    templateUrl: "build/pages/fgen-modal/fgen-modal.html",
    directives: [SilverNeedleChart]
})
export class ModalFgenPage {
    @ViewChild('chart') chart: SilverNeedleChart;
    private platform: Platform;
    private viewCtrl: ViewController;
    private params: NavParams;
    
    public value: number;
    
    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams
    ) {
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        //Not sure how to get params passed
        this.value = this.params.get('num');
    }

    closeModal() {
        console.log(this.value);
        this.viewCtrl.dismiss(10);
    }
}