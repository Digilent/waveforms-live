import {Component} from '@angular/core';

@Component({
  templateUrl: 'build/components/autoscale/autoscale.html',
  selector: 'autoscale'
})
export class AutoscaleComponent {
    private delay: string = '0';

    
    constructor() {

    }

    //Remove storage event listener to avoid memory leaks
    ngOnDestroy() {
        
    }
   
}
