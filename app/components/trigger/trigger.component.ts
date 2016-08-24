import {Component, EventEmitter} from '@angular/core';
import {PopoverController} from 'ionic-angular';

//Components 
import {TriggerPopover} from '../trigger-popover/trigger-popover.component';

//Services
import {StorageService} from '../../services/storage/storage.service';

@Component({
  templateUrl: 'build/components/trigger/trigger.html',
  selector: 'trigger'
})
export class TriggerComponent {
    private delay: string = '0';
    private lowerThresh: string = '0';
    private upperThresh: string = '0';
    private popoverCtrl: PopoverController;
    private storageService: StorageService;
    private storageEventListener: EventEmitter<any>;
    private showTriggerSettings: boolean = true;
    
    constructor(_storageService: StorageService, _popoverCtrl: PopoverController) {
        this.popoverCtrl = _popoverCtrl;
        this.storageService = _storageService;
        this.storageEventListener = this.storageService.saveLoadEventEmitter.subscribe((data) => {
            console.log(data);
            if (data === 'save') {
                this.storageService.saveData('trigger', JSON.stringify({
                    delay: this.delay
                }));
            }
            else if (data === 'load') {
                this.storageService.getData('trigger').then((data) => {
                    let dataObject = JSON.parse(data);
                    console.log(dataObject);
                    this.delay = dataObject.delay
                });
            }
        });
    }

    //Remove storage event listener to avoid memory leaks
    ngOnDestroy() {
        this.storageEventListener.unsubscribe();
    }

    toggleTriggerShow() {
        this.showTriggerSettings = !this.showTriggerSettings;
    }
    
    //Open series popover
    openSeriesPopover() {
        let popover = this.popoverCtrl.create(TriggerPopover, {
            triggerComponent: this,
        });
        console.log(popover);
        popover.present({
            ev: event
        });
        popover.onDidDismiss(data => {
        });
    }
   
}
