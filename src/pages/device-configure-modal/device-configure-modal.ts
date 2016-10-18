import {NavParams, ViewController, Platform} from 'ionic-angular';
import {Component} from '@angular/core';

@Component({
    templateUrl: "device-configure-modal.html"
})
export class DeviceConfigureModal {
    public platform: Platform;
    public viewCtrl: ViewController;
    public params: NavParams;

    public hostname: string;
    
    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams
    ) {
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
    }

    //Close modal and save settings if they are changed
    closeModal() {
        this.viewCtrl.dismiss();
    }
    
}