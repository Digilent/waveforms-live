import { Component, ViewChild } from '@angular/core';
import { NavParams, Slides, ViewController, PopoverController } from 'ionic-angular';

//Services
import { StorageService } from '../../services/storage/storage.service';
import { SettingsService } from '../../services/settings/settings.service';

//Components
import { GenPopover } from '../../components/gen-popover/gen-popover.component';

@Component({
    templateUrl: 'wifi-setup.html',
})
export class WifiSetupPage {
    @ViewChild('wifiSlider') slider: Slides;
    public storageService: StorageService;
    public settingsService: SettingsService;
    public params: NavParams;
    public popoverCtrl: PopoverController;
    public viewCtrl: ViewController;
    public savedNetworks: any[] = [];
    public availableNetworks: any[] = [];
    public selectedNetwork = {
        ssid: 'cool router'
    };

    constructor(
        _storageService: StorageService,
        _settingsService: SettingsService,
        _params: NavParams,
        _viewCtrl: ViewController,
        _popoverCtrl: PopoverController
    ) {
        this.storageService = _storageService;
        this.settingsService = _settingsService;
        this.popoverCtrl = _popoverCtrl;
        this.params = _params;
        this.viewCtrl = _viewCtrl;
        console.log('calibrate constructor');
        for (let i = 0; i < 5; i++) {
            this.savedNetworks.push({ssid:'Cool Router ' + i});
            this.availableNetworks.push({ssid:'Available Cool Router ' + i});
        }
    }

    //Need to use this lifestyle hook to make sure the slider exists before trying to get a reference to it
    ionViewDidEnter() {
        let swiperInstance: any = this.slider.getSlider();
        swiperInstance.lockSwipes();
    }

    routeToConfigSlide(network) {
        this.selectedNetwork = network;
        let swiperInstance: any = this.slider.getSlider();
        swiperInstance.unlockSwipes();
        this.slider.slideTo(1);
        swiperInstance.lockSwipes();
    }

    showPopover(event) {
        let popover = this.popoverCtrl.create(GenPopover, {
            dataArray: ['Forget', 'Modify']
        });
        popover.onWillDismiss((data) => {
            if (data == null) { return; }
            if (data.option === 'Forget') {
                console.log('forget');
            }
            else if (data.option === 'Modify') {
                console.log('modify');
            }
        });
        popover.present({
            ev: event
        });
    }

    closeModal() {
        this.viewCtrl.dismiss();
    }

}