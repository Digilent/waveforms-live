import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

@Component({
    templateUrl: "bode.html"
})
export class BodePage {
    public navCtrl: NavController;

    constructor(
        _navCtrl: NavController
    ) {
        this.navCtrl = _navCtrl;
    }

    done() {
        this.navCtrl.pop();
    }

}