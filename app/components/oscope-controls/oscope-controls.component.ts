import {Component} from 'angular2/core';
import {IONIC_DIRECTIVES} from 'ionic-angular';

@Component({
  templateUrl: 'build/components/oscope-controls/oscope-controls.html',
  selector: 'oscope-controls',
  directives: [IONIC_DIRECTIVES]
})
export class OscopeControlsComponent { 
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
    }
    
    
}
