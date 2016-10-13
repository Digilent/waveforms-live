import {Component, Output, EventEmitter} from '@angular/core';

//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';

@Component({
    selector: 'bottom-bar',
    templateUrl: 'bottom-bar.html'
})
export class BottomBarComponent {
    @Output() headerClicked: EventEmitter<any> = new EventEmitter;
    public contentHidden: boolean;
    public deviceManagerService: DeviceManagerService;

    constructor(_deviceManagerService: DeviceManagerService) {
        this.contentHidden = true;
        this.deviceManagerService = _deviceManagerService;
    }

    childHeaderClicked() {
        this.contentHidden = !this.contentHidden;
        this.headerClicked.emit(null);  
    }
}