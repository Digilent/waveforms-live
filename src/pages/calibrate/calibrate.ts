import { Component, ViewChild } from '@angular/core';
import { NavParams, Slides } from 'ionic-angular';

//Services
import { StorageService } from '../../services/storage/storage.service';
import { SettingsService } from '../../services/settings/settings.service';

@Component({
    templateUrl: 'calibrate.html',
})
export class CalibratePage {
    @ViewChild('calibrationSlider') slider: Slides;
    public storageService: StorageService;
    public settingsService: SettingsService;
    public params: NavParams;

    constructor(_storageService: StorageService, _settingsService: SettingsService, _params: NavParams) {
        this.storageService = _storageService;
        this.settingsService = _settingsService;
        this.params = _params;
        console.log('calibrate constructor');
    }

    //Need to use this lifestyle hook to make sure the slider exists before trying to get a reference to it
    ionViewDidEnter() {
        let swiperInstance: any = this.slider.getSlider();
        swiperInstance.lockSwipes();
    }

}