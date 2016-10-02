import {Component, EventEmitter} from '@angular/core';
import {PopoverController} from 'ionic-angular';

//Components 
import {TriggerPopover} from '../trigger-popover/trigger-popover.component';

//Services
import {StorageService} from '../../services/storage/storage.service';

@Component({
  templateUrl: 'trigger.html',
  selector: 'trigger'
})
export class TriggerComponent {
    public delay: string = '0';
    public lowerThresh: string = '0';
    public upperThresh: string = '0';
    public popoverCtrl: PopoverController;
    public storageService: StorageService;
    public storageEventListener: EventEmitter<any>;
    public showTriggerSettings: boolean = true;
    
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
