import {Component} from '@angular/core';

@Component({
  templateUrl: 'build/components/xaxis-controls/xaxis-controls.html',
  selector: 'xaxis-controls',
})
export class XAxisComponent {
    private timePerDiv: string;
    private base: string;
    
    constructor() {
        this.timePerDiv = '3';
        this.base = '12';
    }
   
}