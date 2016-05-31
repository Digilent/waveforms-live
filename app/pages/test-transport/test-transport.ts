import {Page} from 'ionic-angular';

//Components
import {TransportComponent} from '../../components/transport/transport.component';

//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';

@Page({
    templateUrl: 'build/pages/test-transport/test-transport.html',
})
export class TestTransportPage {

    //private transport: TransportComponent = new TransportComponent();
    
    constructor(private deviceManager: DeviceManagerService) {
        console.log('Transport Test Page Constructor');
    }
}
