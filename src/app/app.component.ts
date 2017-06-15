import { Component, ViewChild } from '@angular/core';
import { Platform, MenuController, Nav } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';

//Pages
import { TestChartCtrlsPage } from '../pages/test-chart-ctrls/test-chart-ctrls';
import { SettingsPage } from '../pages/settings/settings';
import { DeviceManagerPage } from '../pages/device-manager-page/device-manager-page';
import { BodePage } from '../pages/bode/bode';

//Services
import { SettingsService } from '../services/settings/settings.service';
import { DeviceManagerService } from 'dip-angular2/services';

@Component({
    templateUrl: 'app.html'
})
export class MyApp {
    @ViewChild(Nav) nav: Nav;

    public rootPage: any = DeviceManagerPage;
    public pages: Array<{ title: string, component: any }>;
    public settingsService: SettingsService;
    public isMobile: boolean = false;

    constructor(
        public platform: Platform,
        public menu: MenuController,
        _settingsService: SettingsService,
        public deviceManagerService: DeviceManagerService
    ) {
        this.initializeApp();
        // set our app's pages
        this.pages = [
            //{ title: 'Instrument Panel', component: TestChartCtrlsPage },
            { title: 'Device Manager', component: DeviceManagerPage },
            { title: 'Settings', component: SettingsPage }
        ];
        this.settingsService = _settingsService;
        //this.settingsService.changeConsoleLog('None');
        if ((this.platform.is('ios') || this.platform.is('android')) && this.platform.is('mobileweb')) {
            this.isMobile = true;
        }
        
        (<any>document).addEventListener("keydown", (event) => {
            if ((event.code === 'KeyS' || event.keyCode === 83) && event.ctrlKey) {
                event.preventDefault();
            }
        });
    }

    initializeApp() {
        this.platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            StatusBar.styleDefault();
            Splashscreen.hide();
        });
    }

    openBode() {
        this.nav.push(BodePage);
        this.menu.close();
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

    openAppStore() {
        if (this.platform.is('android')) {
            window.location.href = this.settingsService.androidAppLink;
        }
        else if (this.platform.is('ios')) {
            window.location.href = this.settingsService.iosAppLink;
        }
    }
}
