import {Component, EventEmitter, Input} from '@angular/core';

//Components
import {SilverNeedleChart} from '../chart/chart.component';

//Services
import {StorageService} from '../../services/storage/storage.service';

@Component({
  templateUrl: 'xaxis-controls.html',
  selector: 'xaxis-controls'
})
export class XAxisComponent {
    @Input() chart: SilverNeedleChart;
    public timePerDiv: string;
    public base: string;
    public storageService: StorageService;
    public storageEventListener: EventEmitter<any>;
    public showTimeSettings: boolean = true;
    
    constructor(_storageService: StorageService) {
        this.storageService = _storageService;
        this.storageEventListener = this.storageService.saveLoadEventEmitter.subscribe((data) => {
            console.log(data);
            if (data === 'save') {
                this.storageService.saveData('xaxis', JSON.stringify({
                    base: this.chart.base,
                    timePerDiv: this.chart.timeDivision
                }));
            }
            else if (data === 'load') {
                this.storageService.getData('xaxis').then((data) => {
                    let dataObject = JSON.parse(data);
                    console.log(dataObject);
                    this.chart.base = dataObject.base;
                    this.chart.timeDivision = dataObject.timePerDiv;
                    this.chart.setTimeSettings(dataObject, false);
                });
            }
        });
    }

    //Remove storage event listener to prevent memory leaks
    ngOnDestroy() {
        this.storageEventListener.unsubscribe();
    }    

    //Called when time settings are changed. Update chart component with new settings and call setTimeSettings
    timeChanged() {
        this.chart.base = parseFloat(this.chart.base.toString());
        this.chart.setTimeSettings({
            timePerDiv: this.chart.timeDivision,
            base: this.chart.base
        }, false);
    }

    //Call chart autoscale on the x axis
    autoscaleX() {
        this.chart.autoscaleAxis('x', 0);
    }

    //Toggle Series visibility
    toggleSeriesSettings(seriesNum: number) {
        this.showTimeSettings = !this.showTimeSettings;
    }
}