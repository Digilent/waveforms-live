import { Component, ViewChild } from '@angular/core';
import { Platform, MenuController, Nav } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';

//Pages
import { TestChartCtrlsPage } from '../pages/test-chart-ctrls/test-chart-ctrls';
import { SettingsPage } from '../pages/settings/settings';
import { ProtocolTestPanel } from '../pages/protocol-test-panel/protocol-test-panel';
import { DeviceManagerPage } from '../pages/device-manager-page/device-manager-page';
import { BodePage } from '../pages/bode/bode';

//Services
import { SettingsService } from '../services/settings/settings.service';

@Component({
    templateUrl: 'app.html'
})
export class MyApp {
    @ViewChild(Nav) nav: Nav;

    public rootPage: any = DeviceManagerPage;
    public pages: Array<{ title: string, component: any }>;
    public settingsService: SettingsService;

    constructor(
        public platform: Platform,
        public menu: MenuController,
        _settingsService: SettingsService
    ) {
        this.initializeApp();

        // set our app's pages
        this.pages = [
            //{ title: 'Instrument Panel', component: TestChartCtrlsPage },
            { title: 'Device Manager', component: DeviceManagerPage },
            { title: 'Settings', component: SettingsPage },
            { title: 'Test Panel', component: ProtocolTestPanel },
            { title: 'Bode Plot', component: BodePage }
        ];
        this.settingsService = _settingsService;
        //this.settingsService.changeConsoleLog('None');
    }

    initializeApp() {
        this.platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            StatusBar.styleDefault();
            Splashscreen.hide();
        });
    }

    toFeedBack() {
        this.menu.close();
        let openTab = window.open('https://forum.digilentinc.com/forum/30-waveforms-live-and-openscope-feedback/', '_blank');
        openTab.location;
    }

    toReference() {
        this.menu.close();
        let openTab = window.open('https://reference.digilentinc.com/reference/software/waveforms-live/start', '_blank');
        openTab.location;
    }

    openPage(page) {
        // close the menu when clicking a link from the menu
        this.menu.close();
        // navigate to the new page if it is not the current page
        if (page.component === TestChartCtrlsPage || page.component === DeviceManagerPage) {
            this.nav.setRoot(page.component);
        }
        else {
            this.nav.push(page.component);
        }
    }
}
