import {NavParams, ViewController, Platform, PopoverController} from 'ionic-angular';
import {ViewChild, Component} from '@angular/core';

@Component({
    templateUrl: "build/pages/math-modal/math-modal.html"
})
export class MathModalPage {
    private platform: Platform;
    private viewCtrl: ViewController;
    private params: NavParams;
    private popoverCtrl: PopoverController;
    
    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams,
        _popoverCtrl: PopoverController
    ) {
        this.popoverCtrl = _popoverCtrl;
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
    }

    //Close modal and save settings if they are changed
    closeModal(save: boolean) {
        this.viewCtrl.dismiss();
    }
    
}