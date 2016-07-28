import {Component, Output, EventEmitter, Input} from '@angular/core';
import {NavParams, ViewController, NavController, Popover} from 'ionic-angular';

//Components
import {SilverNeedleChart} from '../chart/chart.component';
import {GenPopover} from '../gen-popover/gen-popover.component';

//Services
import {StorageService} from '../../services/storage/storage.service';

@Component({
  templateUrl: 'build/components/yaxis-controls/yaxis-controls.html',
  selector: 'yaxis-controls',
})
export class YAxisComponent {
    @Input() chart: SilverNeedleChart;
    private numSeries: number[] = [0, 1];
    private storageService: StorageService;
    private storageEventListener: EventEmitter<any>;
    private nav: NavController;
    private viewCtrl: ViewController;
    private params: NavParams;
    
    constructor(_storageService: StorageService, _nav: NavController, _viewCtrl: ViewController, _params: NavParams) {
        this.nav = _nav;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.storageService = _storageService;
        this.storageEventListener = this.storageService.saveLoadEventEmitter.subscribe((data) => {
            console.log(data);
            if (data === 'save') {
                this.storageService.saveData('yaxis', JSON.stringify({
                    voltBase: this.chart.voltBase,
                    voltsPerDiv: this.chart.voltDivision
                }));
            }
            else if (data === 'load') {
                this.storageService.getData('yaxis').then((data) => {
                    let dataObject = JSON.parse(data);
                    dataObject.voltBase.forEach((element, index, array) => {
                        this.chart.setSeriesSettings({
                            seriesNum: index,
                            voltsPerDiv: dataObject.voltsPerDiv[index],
                            voltBase: dataObject.voltBase[index]
                        });
                    });
                });
            }
        });
    }

    ngOnDestroy() {
        this.storageEventListener.unsubscribe();
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
        console.log('hi');
    }

    autoscaleY(i) {
        this.chart.autoscaleAxis('y', i);
        console.log(this.chart.voltBase, this.chart.voltDivision);
    }

    changeMultiplier(i, event) {
        console.log(event);
        let popover: Popover;
        popover = Popover.create(GenPopover, {
            dataArray: this.chart.multipliers
        });

        this.nav.present(popover, {
            ev: event
        });
        popover.onDismiss(data => {
            console.log(data);
            this.chart.voltageMultipliers[i] = data.option;
        });
    }
}