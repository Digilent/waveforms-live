import {Component} from '@angular/core';

//Components
import {Tab1} from './device-manager-tabs/device-manager-tab1/device-manager-tab1';
import {Tab2} from './device-manager-tabs/device-manager-tab2/device-manager-tab2';

@Component({
    templateUrl: 'device-manager-page.html'
})
export class DeviceManagerPage {
    tab1: any;
    tab2: any;

    testArrayRemove: number[] = [1, 2, 3, 4];

    constructor() {
        console.log('device manager page main constructor');
        this.tab1 = Tab1;
        this.tab2 = Tab2;
        
    }
}
