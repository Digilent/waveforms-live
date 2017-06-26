import { Component, ViewChild } from '@angular/core';
import { NavParams, Slides, ViewController, LoadingController } from 'ionic-angular';

//Components
import { ProgressBarComponent } from '../../components/progress-bar/progress-bar.component';

//Services
import { StorageService } from '../../services/storage/storage.service';
import { SettingsService } from '../../services/settings/settings.service';
import { DeviceManagerService } from 'dip-angular2/services';
import { CommandUtilityService } from '../../services/device/command-utility.service';

@Component({
    templateUrl: 'load-firmware.html',
})
export class LoadFirmwarePage {
    @ViewChild('loadFirmwareSlider') slider: Slides;
    @ViewChild('digilentProgressBar') progressBarComponent: ProgressBarComponent;
    public storageService: StorageService;
    public settingsService: SettingsService;
    public loadingCtrl: LoadingController;
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
    public uploadStatusAttemptCount: number = 0;
    public maxUploadStatusAttempts: number = 50;
    public errorUpdatingFirmware: boolean = false;

    constructor(
        _storageService: StorageService,
        _settingsService: SettingsService,
        _params: NavParams,
        _loadingCtrl: LoadingController,
        _viewCtrl: ViewController,
        _deviceManagerService: DeviceManagerService,
        public commandUtilityService: CommandUtilityService
    ) {
        this.deviceManagerService = _deviceManagerService;
        this.storageService = _storageService;
        this.settingsService = _settingsService;
        this.loadingCtrl = _loadingCtrl;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        console.log('load firmware constructor');
        this.agentAddress = this.params.get('agentAddress');
        console.log(this.agentAddress);

        this.deviceManagerService.transport.setHttpTransport(this.agentAddress);
        for (let device in this.settingsService.knownFirmwareUrls) {
            this.deviceFirmwareVersionDictionary[this.settingsService.knownFirmwareUrls[device].prettyName] = {
                listUrl: this.settingsService.knownFirmwareUrls[device].listUrl,
                devListUrl: this.settingsService.knownFirmwareUrls[device].devListUrl,
                devFirmwareUrl: this.settingsService.knownFirmwareUrls[device].devFirmwareUrl,
                firmwareUrl: this.settingsService.knownFirmwareUrls[device].firmwareUrl,
                latest: 'Unable to load latest firmware version.'
            };
            this.deviceManagerService.getLatestFirmwareVersionFromUrl(this.settingsService.knownFirmwareUrls[device].listUrl).then((latestFirmwareVersion) => {
                this.knownDevicePrettyNames.unshift(this.settingsService.knownFirmwareUrls[device].prettyName);
                this.deviceFirmwareVersionDictionary[this.settingsService.knownFirmwareUrls[device].prettyName].latest = latestFirmwareVersion;
            }).catch((e) => {
                console.log(e);
            });
        }

        this.selectedDevice = this.knownDevicePrettyNames[0];
        this.firmwareStatus = 'Select a known device or choose a hex file.';
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

    getFirmwareFromUrl(firmwareUrl: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.deviceManagerService.transport.getRequest(firmwareUrl, 30000).subscribe(
                (data) => {
                    if (data.indexOf('Error') !== -1) { reject('Error getting file'); return; }
                    let buf = new ArrayBuffer(data.length);
                    let bufView = new Uint8Array(buf);
                    for (var i = 0; i < data.length; i < i++) {
                        bufView[i] = data.charCodeAt(i);
                    }
                    this.arrayBufferFirmware = buf;
                    this.postHexFile()
                        .then(() => {
                            resolve();
                        })
                        .catch((e) => {
                            reject(e);
                        });
                },
                (err) => {
                    reject(err);
                    console.log(err);
                },
                () => { }
            );
        });

    }

    fileChange(event) {
        if (event.target.files.length === 0) { return; }
        let fileReader = new FileReader();
        let fileName = event.target.files[0].name;
        this.selectedFileInfo.name = fileName;
        this.firmwareStatus = 'Ready to upload "' + fileName + '".';
        let fileNameSplit = fileName.split('.');
        let fileEnding = fileNameSplit[fileNameSplit.length - 1];
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
        let loading = this.displayLoading();
        this.uploadStatusAttemptCount = 0;
        this.sendHexFile()
            .then(() => {
                this.firmwareStatus = 'Updating firmware';
                let swiperInstance: any = this.slider.getSlider();
                swiperInstance.unlockSwipes();
                this.slider.slideTo(1);
                swiperInstance.lockSwipes();
                this.progressBarComponent.manualStart();
                this.getUploadStatus();
                loading.dismiss();
            })
            .catch((e) => {
                console.log('Error caught trying to upload the firmware');
                loading.dismiss();
                this.firmwareStatus = 'Error uploading firmware. Make sure the device is in bootloader mode and try again.';
            });
    }

    getUploadStatus() {
        let command = {
            "agent": [
                {
                    "command": "updateFirmwareGetStatus"
                }
            ]
        };
        this.deviceManagerService.transport.writeRead('/config', JSON.stringify(command), 'json').subscribe(
            (data) => {
                data = this.arrayBufferToObject(data);
                if (data.agent == undefined || data.agent[0].statusCode !== 0 || data.agent[0].status === 'error') {
                    this.firmwareStatus = 'Error uploading firmware';
                    this.errorUpdatingFirmware = true;
                    return;
                }
                if (data.agent && data.agent[0].status && data.agent[0].status === 'uploading' && data.agent[0].progress) {
                    this.progressBarComponent.manualUpdateVal(data.agent[0].progress);
                }
                if (data.agent[0].status !== 'idle' && this.uploadStatusAttemptCount < this.maxUploadStatusAttempts) {
                    console.log('still updating');
                    this.uploadStatusAttemptCount++;
                    setTimeout(() => {
                        this.getUploadStatus();
                    }, 1000);
                    return;
                }
                if (data.agent[0].status === 'idle') {
                    this.progressBarComponent.manualUpdateVal(100);
                    this.firmwareStatus = 'Upload successful!';
                    return;
                }
                this.firmwareStatus = 'Error uploading firmware';
                this.errorUpdatingFirmware = true;
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );

    }

    displayLoading(message?: string) {
        message = message || 'Transferring Hex File...';
        let loading = this.loadingCtrl.create({
            content: message,
            spinner: 'crescent',
            cssClass: 'custom-loading-indicator'
        });

        loading.present();

        return loading;
    }

    sendHexFile(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.selectedDevice === 'Other' && !this.arrayBufferFirmware) {
                this.firmwareStatus = 'Please select a hex file to upload or choose from the default firmware.';
                reject();
            }
            else if (this.selectedDevice === 'Other' && this.arrayBufferFirmware) {
                this.postHexFile()
                    .then(() => {
                        resolve();
                    })
                    .catch((e) => {
                        reject(e);
                    });
            }
            else {
                this.getFirmwareFromUrl(this.deviceFirmwareVersionDictionary[this.selectedDevice].firmwareUrl + '/OpenScopeMZ-' + this.deviceFirmwareVersionDictionary[this.selectedDevice].latest + '.hex')
                    .then(() => {
                        resolve();
                    })
                    .catch((e) => {
                        reject(e);
                    });
            }
        });
    }

    doneUpdating() {
        this.updateComplete = true;
        this.uploadStatusAttemptCount = 0;
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

    postHexFile(): Promise<any> {
        //this.processBinaryDataAndSend(this.arrayBufferFirmware);
        return new Promise((resolve, reject) => {
            this.deviceManagerService.transport.writeRead('/config', this.generateOsjb(this.arrayBufferFirmware), 'binary').subscribe(
                (data) => {
                    data = this.arrayBufferToObject(data);
                    if (data.agent == undefined || data.agent[0].statusCode > 0) {
                        reject(data);
                        return;
                    }
                    resolve(data);
                },
                (err) => {
                    reject(err);
                },
                () => { }
            );
        });
    }

    generateOsjb(firmwareArrayBuffer: ArrayBuffer) {
        let commandObject = {
            agent: [
                {
                    command: "saveToTempFile",
                    fileName: "openscope-mz-firmware.hex"
                },
                {
                    command: 'uploadFirmware',
                    firmwarePath: 'openscope-mz-firmware.hex',
                    enterBootloader: false
                }
            ]
        };
        let temp = this.commandUtilityService.createChunkedArrayBuffer(commandObject, firmwareArrayBuffer);
        return temp;
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
        return data;
    }

}