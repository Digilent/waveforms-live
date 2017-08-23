import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';
import { ToastService } from '../../services/toast/toast.service';

@Component({
    templateUrl: "logger.html"
})
export class LoggerPage {
    private activeDevice: DeviceService;
    private dismissCallback: () => void;

    constructor(
        private deviceManagerService: DeviceManagerService,
        private navCtrl: NavController,
        private navParams: NavParams
    ) {
        this.dismissCallback = this.navParams.get('onLoggerDismiss');
        this.activeDevice = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
    }

    done() {
        this.navCtrl.pop();
    }

}