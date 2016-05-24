import {Component} from 'angular2/core';
import {IONIC_DIRECTIVES, NavController, Modal} from 'ionic-angular';
import {NgClass} from 'angular2/common';

@Component({
  templateUrl: 'build/components/trigger/trigger.html',
  selector: 'trigger',
  directives: [IONIC_DIRECTIVES, NgClass]
})
export class TriggerComponent {
    private showTriggerMenu: boolean;
    public triggerType: string;
    
    constructor() {
        this.showTriggerMenu = false;
        this.triggerType = 'rising';
    }
    
    toggleTriggerMenu(newType: string) {
        this.showTriggerMenu = !this.showTriggerMenu;
        this.triggerType = newType;
    }
   
}
