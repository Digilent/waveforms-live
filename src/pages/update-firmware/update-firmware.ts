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
    public latestFirmwareVersion: string = 'Unable to load latest firmware version.';
    public updateStatus: string = 'Ready';

    public deviceObject: DeviceCardInfo;
    public agentAddress: string;
    public firmwareUpToDate: boolean = false;

    public availableFirmwareVersions: string[] = ['None'];

    public selectedFirmwareVersion: string = '';
    public hexFileStaged: boolean = false;

    public selectedFileInfo: { name: string, size: number } = { name: '', size: 0 };

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
        this.agentAddress = this.params.get('agentAddress');
        this.deviceObject = this.params.get('deviceObject');
        console.log('update firmware constructor');
        this.deviceManagerService.transport.setHttpTransport(this.deviceObject.deviceBridgeAddress);
        this.getDeviceFirmware();
        this.getFirmwareList();
    }

    getDeviceFirmware() {
        let firmwareVersionObject = this.deviceObject.deviceDescriptor.firmwareVersion;
        let deviceFirmwareVersion = [firmwareVersionObject.major, firmwareVersionObject.minor, firmwareVersionObject.patch].join('.');
        this.deviceFirmwareVersion = deviceFirmwareVersion;
    }

    getFirmwareList() {
        this.deviceManagerService.getFirmwareVersionsFromUrl('https://s3-us-west-2.amazonaws.com/digilent-test').then((firmwareVersionArray: string[]) => {
            console.log(firmwareVersionArray);
            this.availableFirmwareVersions = firmwareVersionArray;
            this.getLatestFirmware();
            this.availableFirmwareVersions.push('Other');
        }).catch((e) => {
            console.log(e);
            this.availableFirmwareVersions = ['Other'];
            this.availableFirmwareVersionsChange('Other');
            this.updateStatus = 'Unable to get firmware versions. Please upload a local hex file.';
        });
    }

    availableFirmwareVersionsChange(event) {
        console.log(event);
        this.selectedFirmwareVersion = event;
        if (event === 'Other') {
            this.hexFileStaged = true;
            if (this.selectedFileInfo.size !== 0) {
                this.updateStatus = 'Ready to upload "' + this.selectedFileInfo.name + '". File size is ' + this.selectedFileInfo.size + ' bytes.';
                this.firmwareUpToDate = false;
            }
            else {
                this.firmwareUpToDate = true;
                this.updateStatus = 'Select a hex file to upload';
            }
            return;
        }
        this.hexFileStaged = false;
        this.firmwareUpToDate = this.deviceFirmwareVersion === event;
        if (this.firmwareUpToDate) {
            this.updateStatus = 'Firmware up to date';
            return;
        }
        this.updateStatus = 'Ready to upload firmware version ' + event;
    }

    openFileInput() {
        document.getElementById('updateFileSelect').click();
    }

    fileChange(event) {
        if (event.target.files.length === 0) { return; }
        let fileReader = new FileReader();
        let fileName = event.target.files[0].name;
        this.selectedFileInfo.name = fileName;
        this.updateStatus = 'Ready to upload "' + fileName + '".';
        let fileEnding = fileName.slice(fileName.indexOf('.') + 1);
        if (fileEnding === 'hex') {
            fileReader.onload = ((file: any) => {
                this.updateStatus += '\r\nFile size is ' + file.loaded + ' bytes.';
                this.selectedFileInfo.size = parseInt(file.loaded);
                this.arrayBufferFirmware = file.target.result;
                this.firmwareUpToDate = false;
            });
            fileReader.readAsArrayBuffer(event.target.files[0]);
        }
        else {
            alert('You Must Upload A Hex File');
        }

    }

    getLatestFirmware() {
        //TODO: read device enum for ip address and then call device man service getFirmwareVersionsFromUrl
        this.latestFirmwareVersion = this.deviceManagerService.getLatestFirmwareVersionFromArray(this.availableFirmwareVersions);
        this.firmwareUpToDate = this.latestFirmwareVersion === this.deviceFirmwareVersion;
        if (this.firmwareUpToDate) {
            this.updateStatus = 'Your device firmware is up to date';
        }
        this.selectedFirmwareVersion = this.latestFirmwareVersion;
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
        console.log(this.selectedFirmwareVersion);
        if (this.selectedFirmwareVersion === 'Other' && !this.arrayBufferFirmware) {
            this.updateStatus = 'Please select a hex file to upload or choose from the default firmware.';
            return;
        }
        else if (this.selectedFirmwareVersion === 'Other' && this.arrayBufferFirmware) {
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

    closeModal() {
        this.viewCtrl.dismiss();
    }
    
    postHexFile() {
        //this.processBinaryDataAndSend(this.arrayBufferFirmware);
        this.deviceManagerService.transport.writeRead('/config', this.generateOsjb(this.arrayBufferFirmware), 'binary').subscribe(
            (data) => {
                console.log(this.arrayBufferToObject(data));
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }
    
    generateOsjb(firmwareArrayBuffer: ArrayBuffer) {
        let commandObject = {
            agent: [{
                command: 'uploadFirmware',
                enterBootloader: true
            }]
        };
        let stringCommand = JSON.stringify(commandObject);
        let binaryIndex = (stringCommand.length + 2).toString() + '\r\n';

        let stringSection = binaryIndex + stringCommand + '\r\n';
        let binaryBufferStringSectionArrayBuf = new ArrayBuffer(stringSection.length);
        let binaryBufferStringSection = new Uint8Array(binaryBufferStringSectionArrayBuf);
        for (let i = 0; i < stringSection.length; i++) {
            binaryBufferStringSection[i] = stringSection.charCodeAt(i);
        }

        let temp = new Uint8Array(stringSection.length + firmwareArrayBuffer.byteLength);
        temp.set(new Uint8Array(binaryBufferStringSection), 0);
        temp.set(new Uint8Array(firmwareArrayBuffer), binaryBufferStringSection.byteLength);
        console.log('temp');
        console.log(temp);
        return temp;
    }

    sendFirmwareUrl() {
        let command = {
            agent: [{
                command: 'uploadFirmware',
                firmwareUrl: 'https://s3-us-west-2.amazonaws.com/digilent-test' + '/' + this.selectedFirmwareVersion + '.hex',
                enterBootloader: true
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