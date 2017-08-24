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
        this.test();
    }

    test() {
        this.activeDevice.instruments.logger.analog.setParameters([1], [-1], [1], [0], [1000000], [0], ['stop'], ["ram"], ['http://blah.com']).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    done() {
        this.navCtrl.pop();
    }

}