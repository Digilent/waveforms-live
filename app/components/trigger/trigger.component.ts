import {Component, EventEmitter} from '@angular/core';
import {NgClass} from '@angular/common';

//Services
import {StorageService} from '../../services/storage/storage.service';

@Component({
  templateUrl: 'build/components/trigger/trigger.html',
  selector: 'trigger',
  directives: [NgClass]
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

    private storageService: StorageService;
    private storageEventListener: EventEmitter<any>;
    
    constructor(_storageService: StorageService) {
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

        this.storageService = _storageService;
        this.storageEventListener = this.storageService.saveLoadEventEmitter.subscribe((data) => {
            console.log(data);
            if (data === 'save') {
                this.storageService.saveData('trigger', JSON.stringify({
                    triggerType: this.triggerType,
                    flagType: this.flagType,
                    selectedChannel: this.selectedChannel,
                    delay: this.delay
                }));
            }
            else if (data === 'load') {
                this.storageService.getData('trigger').then((data) => {
                    let dataObject = JSON.parse(data);
                    console.log(dataObject);
                    this.triggerType = dataObject.triggerType,
                    this.flagType = dataObject.flagType,
                    this.selectedChannel = dataObject.selectedChannel,
                    this.delay = dataObject.delay
                });
            }
        });
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
