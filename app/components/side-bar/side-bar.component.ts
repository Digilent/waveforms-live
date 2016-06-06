import {Component, Output, EventEmitter} from 'angular2/core';
import {IONIC_DIRECTIVES} from 'ionic-angular';

//Components
import {FgenComponent} from '../function-gen/function-gen.component';
import {TriggerComponent} from '../trigger/trigger.component';
import {OscopeControlsComponent} from '../oscope-controls/oscope-controls.component';

@Component({
  templateUrl: 'build/components/side-bar/side-bar.html',
  selector: 'side-bar',
  directives: [IONIC_DIRECTIVES, FgenComponent, TriggerComponent, OscopeControlsComponent]
})
export class SideBarComponent { 
    @Output() toggleSeries: EventEmitter<any> = new EventEmitter();
    
    constructor() {
    
    }
    
    seriesToggle(event) {
        this.toggleSeries.emit(event);
    }
}