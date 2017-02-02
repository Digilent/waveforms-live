import { Component, Output, EventEmitter } from '@angular/core';

@Component({
    templateUrl: 'progress-bar.html',
    selector: 'digilent-progress-bar'
})
export class ProgressBarComponent {
    @Output() progressBarDone: EventEmitter<any> = new EventEmitter();
    public intervalRef;
    public progressBarValue: number = 0;
    public maxValue: number = 100;

    constructor() {

    }

    start(time: number, startingVal?: number, max?: number, updateInterval?: number) {
        startingVal = startingVal || 0;
        max = max || 100;
        updateInterval = updateInterval || 50;

        this.progressBarValue = startingVal;
        this.maxValue = max;

        let progressStartTime = performance.now();
        this.intervalRef = setInterval(() => {
            let tempProgressBarValue = ((performance.now() - progressStartTime) / time) * 100;
            if (tempProgressBarValue >= max) {
                this.stop();
            }
            this.progressBarValue = tempProgressBarValue;
        }, updateInterval);
    }

    manualStart(startingVal?: number, max?: number) {
        startingVal = startingVal || 0;
        max = max || 100;
        this.progressBarValue = startingVal;
        this.maxValue = max;
    }

    manualUpdateVal(newVal: number) {
        this.progressBarValue = newVal;
        if (this.progressBarValue >= this.maxValue) {
            this.stop();
        }
    }

    stop() {
        clearInterval(this.intervalRef);
        this.progressBarDone.emit('Done');
    }

}