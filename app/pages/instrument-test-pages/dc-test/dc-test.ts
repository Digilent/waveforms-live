import {Component} from '@angular/core';

//Services
import {DeviceManagerService} from '../../../services/device/device-manager.service';

@Component({
  templateUrl: 'build/pages/instrument-test-pages/dc-test/dc-test.html'
})
export class DcTestPage {
    
  public deviceManagerService: DeviceManagerService;
    
  constructor(_deviceManagerService: DeviceManagerService) {
      this.deviceManagerService = _deviceManagerService;
  }
}
