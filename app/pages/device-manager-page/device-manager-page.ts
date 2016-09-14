import {Component} from '@angular/core';

//Pages
import {TestChartCtrlsPage} from '../test-chart-ctrls/test-chart-ctrls';

//Components
import {Tab1} from './device-manager-tabs/device-manager-tab1/device-manager-tab1';
import {Tab2} from './device-manager-tabs/device-manager-tab2/device-manager-tab2';

@Component({
    templateUrl: 'build/pages/device-manager-page/device-manager-page.html'
})
export class DeviceManagerPage {
    tab1: any;
    tab2: any;

    constructor() {
        this.tab1 = Tab1;
        this.tab2 = Tab2;
        
    }
}
