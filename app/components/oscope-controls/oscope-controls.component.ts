import {Component, Output, EventEmitter} from '@angular/core';

@Component({
  templateUrl: 'build/components/oscope-controls/oscope-controls.html',
  selector: 'oscope-controls'
})
export class OscopeControlsComponent { 
    @Output() toggleSeries: EventEmitter<any> = new EventEmitter();
    private numOscopeChannels: number;
    private oscopeChannels: string[];
    private oscopeSwitches: boolean[];
    private vPerDiv: string[];
    
    constructor() {
        this.numOscopeChannels = 2;
        this.oscopeChannels = ['O1', 'O2'];
        this.oscopeSwitches = [true, false];
        this.vPerDiv = ['1', '1'];
    }

    toggleScope(scopeNum: number) {
        this.oscopeSwitches[scopeNum] = !this.oscopeSwitches[scopeNum];
        this.toggleSeries.emit({
            channel: scopeNum,
            value: this.oscopeSwitches[scopeNum]
        });
    }
}
