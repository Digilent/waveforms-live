import { Component, ViewChild } from '@angular/core';
import { NavParams, Slides } from 'ionic-angular';

//Services
import { StorageService } from '../../services/storage/storage.service';
import { SettingsService } from '../../services/settings/settings.service';
import { DeviceManagerService } from '../../services/device/device-manager.service';

@Component({
    templateUrl: 'calibrate.html',
})
export class CalibratePage {
    @ViewChild('calibrationSlider') slider: Slides;
    public storageService: StorageService;
    public settingsService: SettingsService;
    public params: NavParams;
    public deviceManagerService: DeviceManagerService;
    public calibrationInstructions: string;

    constructor(
        _storageService: StorageService,
        _settingsService: SettingsService,
        _params: NavParams,
        _deviceManagerService: DeviceManagerService
    ) {
        this.deviceManagerService = _deviceManagerService;
        this.storageService = _storageService;
        this.settingsService = _settingsService;
        this.params = _params;
        console.log('calibrate constructor');
        this.getCalibrationInstructions();
    }

    //Need to use this lifestyle hook to make sure the slider exists before trying to get a reference to it
    ionViewDidEnter() {
        let swiperInstance: any = this.slider.getSlider();
        swiperInstance.lockSwipes();
    }

    getStorageLocations() {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].storageGetLocations().subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    getCalibrationInstructions() {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationGetInstructions().subscribe(
            (data) => {
                console.log(data);
                this.calibrationInstructions = data.device[0].instructions;
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    runCalibrationPretest() {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationPretest().subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    startCalibration() {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationStart().subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    loadCalibration(location: string, fileName: string) {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationLoad(location, fileName).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    readCalibration() {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationRead().subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    saveCalibration(location: string) {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationSave(location).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    applyCalibration() {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationApply().subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

}