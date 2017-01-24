import { Component, ViewChild } from '@angular/core';
import { NavParams, Slides, ViewController } from 'ionic-angular';

//Services
import { StorageService } from '../../services/storage/storage.service';
import { SettingsService } from '../../services/settings/settings.service';
import { DeviceManagerService } from '../../services/device/device-manager.service';

@Component({
    templateUrl: 'load-firmware.html',
})
export class LoadFirmwarePage {
    @ViewChild('loadFirmwareSlider') slider: Slides;
    public storageService: StorageService;
    public settingsService: SettingsService;
    public params: NavParams;
    public viewCtrl: ViewController;
    public deviceManagerService: DeviceManagerService;

    public knownDevicePrettyNames: string[] = ['Other'];
    public selectedDevice: string;

    public arrayBufferFirmware: ArrayBuffer;

    constructor(
        _storageService: StorageService,
        _settingsService: SettingsService,
        _params: NavParams,
        _viewCtrl: ViewController,
        _deviceManagerService: DeviceManagerService
    ) {
        this.deviceManagerService = _deviceManagerService;
        this.storageService = _storageService;
        this.settingsService = _settingsService;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        console.log('load firmware constructor');
        for (let device in this.settingsService.knownFirmwareUrls) {
            console.log(device);
            this.knownDevicePrettyNames.unshift(this.settingsService.knownFirmwareUrls[device].prettyName);
        }
        this.selectedDevice = this.knownDevicePrettyNames[0];
    }

    //Need to use this lifestyle hook to make sure the slider exists before trying to get a reference to it
    ionViewDidEnter() {
        let swiperInstance: any = this.slider.getSlider();
        if (swiperInstance == undefined) {
            setTimeout(() => {
                this.ionViewDidEnter();
            }, 20);
            return;
        }
        swiperInstance.lockSwipes();
    }

    openFileInput() {
        document.getElementById('firmwareFileSelect').click();
    }

    fileChange(event) {
        if (event.target.files.length === 0) { return; }
        let fileReader = new FileReader();
        let fileName = event.target.files[0].name;
        let fileEnding = fileName.slice(fileName.indexOf('.') + 1);
        if (fileEnding === 'hex') {
            fileReader.onload = ((file: any) => {
                this.arrayBufferFirmware = file.target.result;
            });
            fileReader.readAsArrayBuffer(event.target.files[0]);
        }
        else {
            alert('You Must Upload A Hex File');
        }
        
    }

    toProgressBar() {
        console.log(this.arrayBufferFirmware);
    }

    dropdownDeviceChange(event) {
        console.log(event);
        this.selectedDevice = event;
    }

    closeModal() {
        this.viewCtrl.dismiss();
    }

}