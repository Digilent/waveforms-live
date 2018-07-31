import { Component } from '@angular/core';
import { NavController, ViewController } from 'ionic-angular';

@Component({
    selector: 'page-slow-usb-modal',
    templateUrl: 'slow-usb-modal.html'
})
export class SlowUSBModalPage {

    constructor(
        public navCtrl: NavController,
        public viewCtrl: ViewController
    ) { }

    ionViewDidLoad() {
        console.log('Hello SlowUsbModal Page');
    }

    public closeModal() {
        this.viewCtrl.dismiss();
    }
}
