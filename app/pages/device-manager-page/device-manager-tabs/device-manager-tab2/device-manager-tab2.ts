import {Component} from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
    templateUrl: 'build/pages/device-manager-page/device-manager-tabs/device-manager-tab2/device-manager-tab2.html',
    directives: [NgClass]
})
export class Tab2 {
    private findingDevices: boolean = false;
    
    constructor() {

    }

    findDevices() {
        this.findingDevices = !this.findingDevices;
        if (this.findingDevices) {
            alert('This doesnt do anything right now');
        }
    }
}