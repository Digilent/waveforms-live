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
    private showFlagMenu: boolean;
    public triggerType: string;
    public flagType: string;
    public selectedChannel: string;
    public showChannels: boolean;
    
    public channels: string[];
    
    constructor() {
        this.showTriggerMenu = false;
        this.showFlagMenu = false;
        this.showChannels = false;
        this.triggerType = 'rising';
        this.flagType = 'edge';
        this.selectedChannel = 'O1';
        this.channels = ['O1','D1','D2'];
    }
    
    toggleTriggerMenu(newType: string) {
        this.showTriggerMenu = !this.showTriggerMenu;
        this.triggerType = newType;
    }
    
    toggleFlagType(newType: string) {
        this.showFlagMenu = !this.showFlagMenu;
        this.flagType = newType;
    }
    
    toggleDigitalChannel(selectedChannel) {
        this.showChannels = !this.showChannels;
        this.selectedChannel = selectedChannel;
    }
    
    forceTrigger() {
        console.log('trigger event');
    }
   
}
