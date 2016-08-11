import {Component, Output, EventEmitter, Input} from '@angular/core';
import {NavParams, ViewController, PopoverController} from 'ionic-angular';

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
    private viewCtrl: ViewController;
    private params: NavParams;
    private popoverCtrl: PopoverController;
    
    constructor(_storageService: StorageService, _viewCtrl: ViewController, _params: NavParams, _popoverCtrl: PopoverController) {
        this.popoverCtrl = _popoverCtrl;
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

    turnOnAutoscale() {
        this.chart.toggleAutoscale();
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
    }

    changeMultiplier(i, event) {
        let popover = this.popoverCtrl.create(GenPopover, {
            dataArray: this.chart.multipliers
        });

        popover.present({
            ev: event
        });
        popover.onDidDismiss(data => {
            this.chart.changeMultiplier(i, data.option, this.chart.voltageMultipliers[i]);
            this.chart.voltageMultipliers[i] = data.option;
        });
    }
}