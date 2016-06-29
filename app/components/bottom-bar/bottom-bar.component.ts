import {Component, Output, EventEmitter} from '@angular/core';

//Components
import {DigitalIoComponent} from '../digital-io/digital-io.component';
import {DcSupplyComponent} from '../dc-supply/dc-supply.component';

//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';

@Component({
    selector: 'bottom-bar',
    templateUrl: 'build/components/bottom-bar/bottom-bar.html',
    directives: [DigitalIoComponent, DcSupplyComponent]
})
export class BottomBarComponent {
    @Output() headerClicked: EventEmitter<any> = new EventEmitter;
    public contentHidden: boolean;
    private deviceManagerService: DeviceManagerService;

    constructor(_deviceManagerService: DeviceManagerService) {
        this.contentHidden = true;
        this.deviceManagerService = _deviceManagerService;
    }

    holy() {
        this.contentHidden = !this.contentHidden;
        this.headerClicked.emit(null);  
    }
}