import { Component, ViewChild } from '@angular/core';
import { Platform, MenuController, Nav } from 'ionic-angular';
import { StatusBar } from 'ionic-native';

//Pages
import { TestChartCtrlsPage } from '../pages/test-chart-ctrls/test-chart-ctrls';
import { SettingsPage } from '../pages/settings/settings';
import { ProtocolTestPanel } from '../pages/protocol-test-panel/protocol-test-panel';
import { DeviceManagerPage } from '../pages/device-manager-page/device-manager-page';
import { FlotPage } from '../pages/flot/flot';

//Services
import { SettingsService } from '../services/settings/settings.service';

@Component({
    templateUrl: 'app.html'
})
export class MyApp {
    @ViewChild(Nav) nav: Nav;

    // make HelloIonicPage the root (or first) page
    rootPage: any = DeviceManagerPage;
    pages: Array<{ title: string, component: any }>;
    public settingsService: SettingsService;

    constructor(
        public platform: Platform,
        public menu: MenuController,
        _settingsService: SettingsService
    ) {
        this.initializeApp();

        // set our app's pages
        this.pages = [
            { title: 'Instrument Panel', component: TestChartCtrlsPage },
            //{ title: 'Home Page', component: HomePage },
            //{ title: 'Test Page', component: TestPage },
            { title: 'Settings', component: SettingsPage },
            { title: 'Flot', component: FlotPage },
            { title: 'Test Panel', component: ProtocolTestPanel },
            { title: 'Device Manager', component: DeviceManagerPage }
        ];
        this.settingsService = _settingsService;
        //this.settingsService.changeConsoleLog('both');
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
