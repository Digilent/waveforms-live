import { Component, ViewChild } from '@angular/core';
import { NavParams, Slides, ViewController } from 'ionic-angular';

//Components
import { ProgressBarComponent } from '../../components/progress-bar/progress-bar.component';

//Services
import { StorageService } from '../../services/storage/storage.service';
import { SettingsService } from '../../services/settings/settings.service';
import { DeviceManagerService } from '../../services/device/device-manager.service';

@Component({
    templateUrl: 'load-firmware.html',
})
export class LoadFirmwarePage {
    @ViewChild('loadFirmwareSlider') slider: Slides;
    @ViewChild('digilentProgressBar') progressBarComponent: ProgressBarComponent;
    public storageService: StorageService;
    public settingsService: SettingsService;
    public params: NavParams;
    public viewCtrl: ViewController;
    public deviceManagerService: DeviceManagerService;

    public knownDevicePrettyNames: string[] = ['Other'];
    public selectedDevice: string;
    public deviceFirmwareVersionDictionary: any = {};

    public arrayBufferFirmware: ArrayBuffer;
    public selectedFileInfo: { name: string, size: number } = { name: '', size: 0 };
    public agentAddress: string;

    public firmwareStatus: string = 'Select a default device or upload your own hex file.';
    public updateComplete: boolean = false;

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
        this.agentAddress = this.params.get('agentAddress');
        console.log(this.agentAddress);

        this.deviceManagerService.transport.setHttpTransport(this.agentAddress);
        for (let device in this.settingsService.knownFirmwareUrls) {
            this.knownDevicePrettyNames.unshift(this.settingsService.knownFirmwareUrls[device].prettyName);
            this.deviceFirmwareVersionDictionary[this.settingsService.knownFirmwareUrls[device].prettyName] = {
                firmwareUrl: this.settingsService.knownFirmwareUrls[device].firmwareUrl,
                latest: 'unknown'
            };
            this.deviceManagerService.getLatestFirmwareVersionFromUrl(this.settingsService.knownFirmwareUrls[device].firmwareUrl).then((latestFirmwareVersion) => {
                this.deviceFirmwareVersionDictionary[this.settingsService.knownFirmwareUrls[device].prettyName].latest = latestFirmwareVersion;
            });
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
        this.selectedFileInfo.name = fileName;
        this.firmwareStatus = 'Ready to upload "' + fileName + '".';
        let fileEnding = fileName.slice(fileName.indexOf('.') + 1);
        if (fileEnding === 'hex') {
            fileReader.onload = ((file: any) => {
                this.firmwareStatus += '\r\nFile size is ' + file.loaded + ' bytes.';
                this.selectedFileInfo.size = parseInt(file.loaded);
                this.arrayBufferFirmware = file.target.result;
            });
            fileReader.readAsArrayBuffer(event.target.files[0]);
        }
        else {
            alert('You Must Upload A Hex File');
        }

    }

    toProgressBar() {
        if (this.selectedDevice === 'Other' && !this.arrayBufferFirmware) {
            this.firmwareStatus = 'Please select a hex file to upload or choose from the default firmware.';
            return;
        }
        if (this.selectedDevice === 'Other' && this.arrayBufferFirmware) {
            this.postHexFile();
        }
        else {
            this.sendFirmwareUrl();
        }
        let swiperInstance: any = this.slider.getSlider();
        swiperInstance.unlockSwipes();
        this.slider.slideTo(1);
        swiperInstance.lockSwipes();
        this.progressBarComponent.start(10000);
    }

    doneUpdating() {
        this.updateComplete = true;
    }

    dropdownDeviceChange(event) {
        console.log(event);
        this.selectedDevice = event;
        if (event !== 'Other') {
            this.firmwareStatus = 'Ready to upload selected firmware.';
        }
        else if (event === 'Other' && !this.arrayBufferFirmware) {
            this.firmwareStatus = 'Select a hex file to upload.';
        }
        else if (event === 'Other' && this.arrayBufferFirmware) {
            this.firmwareStatus = 'Ready to upload "' + this.selectedFileInfo.name + '". File size is ' + this.selectedFileInfo.size + ' bytes.';
        }
    }

    closeModal() {
        this.viewCtrl.dismiss();
    }

    postHexFile() {
        this.deviceManagerService.transport.writeRead('/config', new Uint8Array(this.arrayBufferFirmware), 'binary').subscribe(
            (data) => {
                console.log(this.arrayBufferToObject(data));
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    sendFirmwareUrl() {
        let command = {
            agent: [{
                command: 'uploadFirmwareFromUrl',
                firmwareUrl: this.deviceFirmwareVersionDictionary[this.selectedDevice].firmwareUrl + '/' + this.deviceFirmwareVersionDictionary[this.selectedDevice].latest
            }]
        };
        this.deviceManagerService.transport.writeRead('/config', JSON.stringify(command), 'json').subscribe(
            (data) => {
                console.log(this.arrayBufferToObject(data));
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    arrayBufferToObject(arrayBuffer) {
        let data;
        try {
            let stringify = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0)));
            console.log(stringify);
            data = JSON.parse(stringify);
        }
        catch (e) {
            return;
        }
        if (data.agent == undefined || data.agent[0].statusCode > 0) {
            return;
        }
        return data;
    }

}