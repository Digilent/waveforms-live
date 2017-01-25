import { Component, ViewChild } from '@angular/core';
import { NavParams, Slides, ViewController } from 'ionic-angular';

//Components
import { ProgressBarComponent } from '../../components/progress-bar/progress-bar.component';

//Services
import { StorageService } from '../../services/storage/storage.service';
import { SettingsService } from '../../services/settings/settings.service';
import { DeviceManagerService } from '../../services/device/device-manager.service';

//Interfaaces
import { DeviceCardInfo } from '../device-manager-page/device-manager-page.interface';

@Component({
    templateUrl: 'update-firmware.html',
})
export class UpdateFirmwarePage {
    @ViewChild('updateFirmwareSlider') slider: Slides;
    @ViewChild('digilentProgressBar') progressBarComponent: ProgressBarComponent;
    public storageService: StorageService;
    public settingsService: SettingsService;
    public params: NavParams;
    public viewCtrl: ViewController;
    public deviceManagerService: DeviceManagerService;
    public updateComplete: boolean = false;

    public deviceFirmwareVersion: string = '';
    public latestFirmwareVersion: string = '';
    public updateStatus: string = 'Ready';

    public deviceObject: DeviceCardInfo;
    public agentAddress: string;
    public firmwareUpToDate: boolean = false;

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
        this.agentAddress = this.params.get('agentAddress');
        this.deviceObject = this.params.get('deviceObject');
        console.log('update firmware constructor');
        this.getDeviceFirmware();
        this.getLatestFirmware();
    }

    getDeviceFirmware() {
        let firmwareVersionObject = this.deviceObject.deviceDescriptor.firmwareVersion;
        let deviceFirmwareVersion = [firmwareVersionObject.major, firmwareVersionObject.minor, firmwareVersionObject.patch].join('.');
        this.deviceFirmwareVersion = deviceFirmwareVersion;
    }

    getLatestFirmware() {
        //TODO: read device enum for ip address and then call device man service getFirmwareVersionsFromUrl
        this.deviceManagerService.getLatestFirmwareVersionFromUrl('https://s3-us-west-2.amazonaws.com/digilent-test').then((latestFirmwareVersion) => {
            this.latestFirmwareVersion = latestFirmwareVersion;
            this.firmwareUpToDate = this.latestFirmwareVersion === this.deviceFirmwareVersion;
            if (this.firmwareUpToDate) {
                this.updateStatus = 'Your device firmware is up to date';
            }
        })
        .catch((e) => {
            console.log(e);
        });
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

    toProgressBar() {
        let swiperInstance: any = this.slider.getSlider();
        swiperInstance.unlockSwipes();
        this.slider.slideTo(1);
        swiperInstance.lockSwipes();
        this.progressBarComponent.start(10000);
    }

    doneUpdating() {
        this.updateComplete = true;
    }

    closeModal() {
        this.viewCtrl.dismiss();
    }

}