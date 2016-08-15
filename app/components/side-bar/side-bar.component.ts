import {Component, Output, EventEmitter} from '@angular/core';

//Components
import {FgenComponent} from '../function-gen/function-gen.component';
import {TriggerComponent} from '../trigger/trigger.component';
import {OscopeControlsComponent} from '../oscope-controls/oscope-controls.component';

@Component({
  templateUrl: 'build/components/side-bar/side-bar.html',
  selector: 'side-bar',
  directives: [FgenComponent, TriggerComponent, OscopeControlsComponent]
})
export class SideBarComponent { 
    @Output() toggleSeries: EventEmitter<any> = new EventEmitter();
    
    constructor() {
    
    }
    
    //Emit event to toggle series on/off
    seriesToggle(event) {
        this.toggleSeries.emit(event);
    }
}