import { Component, ViewChild } from '@angular/core';
import { NavParams, Slides, ViewController, PopoverController } from 'ionic-angular';

//Services
import { StorageService } from '../../services/storage/storage.service';
import { SettingsService } from '../../services/settings/settings.service';
import { DeviceManagerService } from '../../services/device/device-manager.service';

//Components
import { GenPopover } from '../../components/gen-popover/gen-popover.component';

@Component({
    templateUrl: 'wifi-setup.html',
})
export class WifiSetupPage {
    @ViewChild('wifiSlider') slider: Slides;
    public storageService: StorageService;
    public settingsService: SettingsService;
    public deviceManagerService: DeviceManagerService;
    public params: NavParams;
    public popoverCtrl: PopoverController;
    public viewCtrl: ViewController;
    public savedNetworks: any[] = [];
    public availableNetworks: any[] = [];
    public selectedNetwork = {
        ssid: 'cool router'
    };
    public save: boolean = true;
    public autoConnect: boolean = true;
    public disableAutoConnect: boolean = false;
    public connectNow: boolean = true;
    public password: string = '';

    public availableNics: string[] = ['None'];
    public selectedNic: string = 'None';

    constructor(
        _storageService: StorageService,
        _settingsService: SettingsService,
        _deviceManagerService: DeviceManagerService,
        _params: NavParams,
        _viewCtrl: ViewController,
        _popoverCtrl: PopoverController
    ) {
        this.storageService = _storageService;
        this.settingsService = _settingsService;
        this.deviceManagerService = _deviceManagerService;
        this.popoverCtrl = _popoverCtrl;
        this.params = _params;
        this.viewCtrl = _viewCtrl;
        console.log('calibrate constructor');
        for (let i = 0; i < 5; i++) {
            this.availableNetworks.push({ ssid: 'Available Cool Router ' + i });
        }

        this.getNicList();
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

    nicSelection(event) {
        console.log(event);
        this.selectedNic = event;
    }

    getNicList() {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].nicList().subscribe(
            (data) => {
                console.log(data);
                this.availableNics = data.device[0].nics;
                this.selectedNic = data.device[0].nics[0];
                this.getNicStatus(this.selectedNic);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    getNicStatus(adapter: string) {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].nicGetStatus(adapter).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    scanWifi(adapter: string) {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].wifiScan(adapter).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    readScannedWifiNetworks(adapter: string) {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].wifiReadScannedNetworks(adapter).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    wifiSetParameters(adapter: string, ssid: string, securityType: 'wep40'|'wep104'|'wpa'|'wpa2', autoConnect: boolean, passphrase?: string, keys?: string, keyIndex?: number) {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].wifiSetParameters(
            adapter, ssid, securityType, autoConnect, passphrase, keys, keyIndex
        ).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
            );
    }

    getSavedWifiNetworks(storageLocation: string) {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].wifiListSavedNetworks(storageLocation).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    deleteSavedWifiNetwork(storageLocation: string, ssid: string) {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].wifiDeleteParameters(storageLocation, ssid).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    connectToNetwork(adapter: string, parameterSet: 'activeParameterSet'|'workingParameterSet', force: boolean) {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].nicConnect(adapter, parameterSet, force).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    disconnectFromNetwork(adapter) {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].nicDisconnect(adapter).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    saveWifiNetwork(storageLocation: string) {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].wifiSaveNetwork(storageLocation).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    loadWifiNetwork(storageLocation: string, ssid: string) {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].wifiLoadParameters(storageLocation, ssid).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    checkboxChanged(checkboxName: string) {
        if (checkboxName === 'save' && !this.save) {
            this.autoConnect = false;
            setTimeout(() => { this.disableAutoConnect = true; }, 20);
        }
        if (checkboxName === 'save' && this.save) {
            this.disableAutoConnect = false;
        }
    }

    routeToConfigSlide(network) {
        this.disableAutoConnect = false;
        this.password = '';
        this.save = true;
        this.autoConnect = true;
        this.connectNow = true;
        this.selectedNetwork = network;
        let swiperInstance: any = this.slider.getSlider();
        swiperInstance.unlockSwipes();
        this.slider.slideTo(1);
        swiperInstance.lockSwipes();
    }

    addNetwork() {
        for (let i = 0; i < this.savedNetworks.length; i++) {
            if (JSON.stringify(this.selectedNetwork) === JSON.stringify(this.savedNetworks[i])) {
                //Exists already. Modify existing?TODO
                return;
            }
        }
        this.savedNetworks.unshift(this.selectedNetwork);
        this.backToNetworks();
    }

    backToNetworks() {
        let swiperInstance: any = this.slider.getSlider();
        swiperInstance.unlockSwipes();
        this.slider.slideTo(0);
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