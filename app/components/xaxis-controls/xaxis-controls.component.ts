import {Component, Output, EventEmitter, Input} from '@angular/core';
import {NgClass} from '@angular/common';

//Components
import {SilverNeedleChart} from '../chart/chart.component';

//Services
import {StorageService} from '../../services/storage/storage.service';

@Component({
  templateUrl: 'build/components/xaxis-controls/xaxis-controls.html',
  selector: 'xaxis-controls',
  directives: [NgClass]
})
export class XAxisComponent {
    @Input() chart: SilverNeedleChart;
    private timePerDiv: string;
    private base: string;
    private storageService: StorageService;
    private storageEventListener: EventEmitter<any>;
    private showTimeSettings: boolean = true;
    
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
                    this.chart.setTimeSettings(dataObject);
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
        });
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