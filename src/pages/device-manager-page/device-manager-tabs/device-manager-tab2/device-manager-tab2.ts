import {Component} from '@angular/core';

@Component({
    templateUrl: 'device-manager-tab2.html'
})
export class Tab2 {
    public findingDevices: boolean = false;
    
    constructor() {
        console.log('tab2 constructor');
    }

    findDevices() {
        this.findingDevices = !this.findingDevices;
        if (this.findingDevices) {
            alert('This doesnt do anything right now');
        }
    }
}