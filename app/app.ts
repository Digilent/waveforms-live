import 'es6-shim';
import {App, Platform, MenuController, Nav, ionicBootstrap} from 'ionic-angular';
import {StatusBar} from 'ionic-native';
import {ViewChild, Component} from '@angular/core';
import {HTTP_PROVIDERS} from '@angular/http';

//Pages
import {HomePage} from './pages/home/home';
import {SideControlsPage} from './pages/sidecontrols/sidecontrols';
import {TestChartPage} from './pages/test-chart/test-chart';
import {TestChartCtrlsPage} from './pages/test-chart-ctrls/test-chart-ctrls';
import {TestPage} from './pages/test-page/test-page';
import {SettingsPage} from './pages/settings/settings';

//Services
import {DeviceManagerService} from './services/device/device-manager.service';
import {StorageService} from './services/storage/storage.service';

/* ---------- Uncomment this to switch to production mode ---------
import {enableProdMode} from '@angular/core';
enableProdMode();
-----------------------------------------------------------------*/



@Component({
  templateUrl: 'build/app.html',
})
class MyApp {
  // make HelloIonicPage the root (or first) page
  @ViewChild(Nav) nav: Nav;
  rootPage: any = SettingsPage;
  pages: Array<{ title: string, component: any }>;

  constructor(
    private app: App,
    private platform: Platform,
    private menu: MenuController,
    private deviceManager: DeviceManagerService

  ) {
    this.initializeApp();

    // set our app's pages
    this.pages = [
      { title: 'Home', component: HomePage },
      { title: 'SideControls', component: SideControlsPage },
      { title: 'Test Chart', component: TestChartPage },
      { title: 'Test Chart Controls', component: TestChartCtrlsPage },
      { title: 'Test Page', component: TestPage },
      { title: 'Settings', component: SettingsPage }
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

ionicBootstrap(MyApp, [HTTP_PROVIDERS, DeviceManagerService, StorageService], {});
