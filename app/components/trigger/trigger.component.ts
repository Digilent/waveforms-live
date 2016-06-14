import {Component} from '@angular/core';
import {IONIC_DIRECTIVES} from 'ionic-angular';
import {NgClass} from '@angular/common';

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
    private delay: string;
    private level: string;

    private showOptions: boolean;
    
    public channels: string[];
    
    constructor() {
        this.showTriggerMenu = false;
        this.showFlagMenu = false;
        this.showChannels = false;
        this.triggerType = 'rising';
        this.flagType = 'edge';
        this.selectedChannel = 'O1';
        this.channels = ['O1','D1','D2'];
        this.delay = '1';
        this.level = '0';
        this.showOptions = false;
    }
    
    toggleTriggerMenu(newType: string) {
        this.showTriggerMenu = !this.showTriggerMenu;
        this.triggerType = newType;
    }
    
    toggleFlagType(newType: string) {
        this.showFlagMenu = !this.showFlagMenu;
        this.flagType = newType;
    }
    
    toggleDigitalChannel(selectedChannel: string) {
        this.showChannels = !this.showChannels;
        this.selectedChannel = selectedChannel;
    }
    
    forceTrigger() {
        console.log('trigger event');
    }

    showAlert() {
        this.showOptions = !this.showOptions;
    }
   
}
