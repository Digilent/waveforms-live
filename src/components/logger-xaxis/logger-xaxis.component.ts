import { Component, Input, Output, EventEmitter } from '@angular/core';

//Services
import { TooltipService } from '../../services/tooltip/tooltip.service';
import { ToastController } from 'ionic-angular';
import { SettingsService } from '../../services/settings/settings.service';

@Component({
    templateUrl: 'logger-xaxis.html',
    selector: 'logger-xaxis'
})
export class LoggerXAxisComponent {
    @Input('tpdArray') tpdArray: number[];
    @Input('tpdIndex') tpdIndex: number;
    @Input('tpdAbsolute') tpdAbsolute: number;
    @Output('tpdChange') tpdChange: EventEmitter<number> = new EventEmitter<number>();
    @Output('avgChange') avgChange: EventEmitter<number> = new EventEmitter<number>();
    public timePerDiv: string;
    public base: string;
    public showTimeSettings: boolean = true;
    public loggerBufferSize: number = 10;

    public average: number = 1;
    public maxAverage: number = 256;

    constructor(
        public tooltipService: TooltipService,
        public toastCtrl: ToastController,
        public settingsService: SettingsService
    ) {
        this.loggerBufferSize = this.settingsService.getLoggerBufferSize() || this.loggerBufferSize;
    }

    loggerBufferSizeChange(trueVal) {
        console.log("Timeframe changed:", trueVal);
        
        if (trueVal <= 0) {
            trueVal = this.loggerBufferSize;

            this.toastCtrl.create({
                message: 'Invalid buffer size value. Must be some positive numeric value',
                duration: 3000
            }).present();

        } else {
            this.loggerBufferSize = trueVal;
        }
    }

    valChange(trueValue) {
        console.log(trueValue);
        if (trueValue < this.tpdArray[0]) {
            trueValue = this.tpdArray[0];
        }
        else if (trueValue > this.tpdArray[this.tpdArray.length - 1]) {
            trueValue = this.tpdArray[this.tpdArray.length - 1];
        }
        if (this.tpdAbsolute === trueValue) {
            console.log('the same');
            
            return;
        }
        
        this.tpdChange.emit(trueValue);
    }

    incrementTpd() {
        this.tpdChange.emit(this.tpdArray[this.tpdIndex + 1]);
    }

    decrementTpd() {
        this.tpdChange.emit(this.tpdArray[this.tpdIndex - 1]);
    }

    incrementLoggerBufferSize() {
        let oneTenth = 1;
        let temp = this.loggerBufferSize;

        while (temp >= 10) {
            temp = temp / 10;
            oneTenth *= 10;
        }

        this.loggerBufferSize += oneTenth;
    }

    decrementLoggerBufferSize() {
        let oneTenth = 1;
        let temp = this.loggerBufferSize;

        while(temp > 10) {
            temp = temp / 10;
            oneTenth *= 10;
        }

        if (this.loggerBufferSize - oneTenth < 0) return;

        this.loggerBufferSize -= oneTenth;
    }

    incrementAverage() {
        if (this.average < this.maxAverage) {
            this.average *= 2;

            this.avgChange.emit(this.average);
        }
    }

    averageChange(trueVal) {
        let powerOfTwo = (x) => (Math.log(x)/Math.log(2)) % 1 === 0;
        
        console.log(this.average);

        if (!powerOfTwo(trueVal)) {
            this.toastCtrl.create({
                message: "Average must be a power of 2",
                duration: 3000
            }).present();
        }

        this.average = trueVal;

        this.avgChange.emit(this.average);
    }

    decrementAverage() {
        if (this.average > 1) {
            this.average /= 2;

            this.avgChange.emit(this.average);
        }
    }

    //Toggle Series visibility
    toggleSeriesSettings() {
        this.showTimeSettings = !this.showTimeSettings;
    }
}