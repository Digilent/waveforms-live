import {Component} from '@angular/core';

@Component({
  templateUrl: 'build/components/yaxis-controls/yaxis-controls.html',
  selector: 'yaxis-controls',
})
export class YAxisComponent {
    private voltsPerDiv: string[];
    private voltBase: string[];
    private numSeries: number[] = [0, 1];
    
    constructor() {
        this.voltsPerDiv = ['10','5'];
        this.voltBase = ['50', '12'];
    }
}