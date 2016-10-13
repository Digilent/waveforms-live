import { Component, ViewChild } from '@angular/core';
import { Platform, MenuController, Nav } from 'ionic-angular';
import { StatusBar } from 'ionic-native';

//Pages
import { HomePage } from '../pages/home/home';
import { TestChartPage } from '../pages/test-chart/test-chart';
import { TestChartCtrlsPage } from '../pages/test-chart-ctrls/test-chart-ctrls';
import { TestPage } from '../pages/test-page/test-page';
import { SettingsPage } from '../pages/settings/settings';
import { ProtocolTestPanel } from '../pages/protocol-test-panel/protocol-test-panel';
import { DeviceManagerPage } from '../pages/device-manager-page/device-manager-page';

@Component({
    templateUrl: 'app.html'
})
export class MyApp {
    @ViewChild(Nav) nav: Nav;

    // make HelloIonicPage the root (or first) page
    rootPage: any = DeviceManagerPage;
    pages: Array<{ title: string, component: any }>;

    constructor(
        public platform: Platform,
        public menu: MenuController
    ) {
        this.initializeApp();

        // set our app's pages
        this.pages = [
            { title: 'Instrument Panel', component: TestChartCtrlsPage },
            //{ title: 'Home Page', component: HomePage },
            //{ title: 'Test Page', component: TestPage },
            { title: 'Settings', component: SettingsPage },
            { title: 'Test Panel', component: ProtocolTestPanel },
            { title: 'Device Manager', component: DeviceManagerPage }
        ];
    }

    initializeApp() {
        this.platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            StatusBar.styleDefault();
        });
    }

    openPage(page) {
        // close the menu when clicking a link from the menu
        this.menu.close();
        // navigate to the new page if it is not the current page
        if (page.component === TestChartCtrlsPage) {
            this.nav.setRoot(page.component);
        }
        else {
            this.nav.push(page.component);
        }
    }
}
