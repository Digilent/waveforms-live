import { Component, EventEmitter } from '@angular/core';
import { PopoverController } from 'ionic-angular';

//Components 
import { TriggerPopover } from '../trigger-popover/trigger-popover.component';
import { DeviceComponent } from '../device/device.component';

//Services
import { StorageService } from '../../services/storage/storage.service';
import { DeviceManagerService } from '../../services/device/device-manager.service';

@Component({
    templateUrl: 'trigger.html',
    selector: 'trigger'
})
export class TriggerComponent {
    public delay: string = '0';
    public lowerThresh: string = '-5';
    public upperThresh: string = '0';
    public edgeDirection: string = 'rising';
    public triggerSource: string = 'osc 1';
    public triggerType: string = 'edge';
    public popoverCtrl: PopoverController;
    public storageService: StorageService;
    public storageEventListener: EventEmitter<any>;
    public showTriggerSettings: boolean = true;
    public imgSrc: string = 'assets/img/trigger-rising.png';
    public devMngSrv: DeviceManagerService;
    public activeDevice: DeviceComponent;

    constructor(_storageService: StorageService, _popoverCtrl: PopoverController, _devMngSrv: DeviceManagerService) {
        this.popoverCtrl = _popoverCtrl;
        this.devMngSrv = _devMngSrv;
        this.activeDevice = this.devMngSrv.devices[this.devMngSrv.activeDeviceIndex];
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
    openTriggerPopover(event) {
        let popover = this.popoverCtrl.create(TriggerPopover, {
            triggerComponent: this,
        });
        popover.present({
            ev: event
        });
        popover.onDidDismiss(data => {
        });
    }

    setTrigType() {
        if (this.edgeDirection === 'rising') {
            this.edgeDirection = 'falling';
        }
        else {
            this.edgeDirection = 'rising';
        }
        this.imgSrc = this.edgeDirection === 'rising' ? 'assets/img/trigger-rising.png' : 'assets/img/trigger-falling.png'
    }

}
