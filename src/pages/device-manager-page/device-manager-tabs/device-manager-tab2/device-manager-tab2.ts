import {Component} from '@angular/core';
import {App} from 'ionic-angular';

@Component({
    templateUrl: 'device-manager-tab2.html'
})
export class Tab2 {
    public findingDevices: boolean = false;
    public app: App;
    
    constructor(_app: App) {
        console.log('tab2 constructor');
        this.app = _app;
    }

    ionViewDidEnter() {
        this.app.setTitle('Discover Devices');
    }

    findDevices() {
        this.findingDevices = !this.findingDevices;
        if (this.findingDevices) {
            alert('Currently unimplemented :(');
        }
    }
}