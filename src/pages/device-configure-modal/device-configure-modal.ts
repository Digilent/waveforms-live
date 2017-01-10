import { NavParams, Platform, NavController, ModalController, LoadingController } from 'ionic-angular';
import { Component } from '@angular/core';

//Components
import { DeviceManagerPage } from '../device-manager-page/device-manager-page';
import { CalibratePage } from '../calibrate/calibrate';
import { WifiSetupPage } from '../wifi-setup/wifi-setup';

//Interfaces
import { DeviceCardInfo } from '../device-manager-page/device-manager-page.interface';

//Services
import { DeviceManagerService } from '../../services/device/device-manager.service';

@Component({
    templateUrl: "device-configure-modal.html"
})

export class DeviceConfigureModal {
    public platform: Platform;
    public loadingCtrl: LoadingController;
    public modalCtrl: ModalController;
    public navCtrl: NavController;
    public deviceManagerService: DeviceManagerService;
    public params: NavParams;

    public potentialDevices: string[];
    public deviceBridgeAddress: string;
    public deviceManagerPageRef: DeviceManagerPage;
    public deviceObject: DeviceCardInfo;

    //Content controllers
    public bridgeConfigure: boolean = false;
    public deviceConfigure: boolean = false;
    public devicesEnumeration: boolean = false;

    //Leftovers from transfer. TODO wade through this
    public hostname: string = 'test';

    constructor(
        _platform: Platform,
        _modalCtrl: ModalController,
        _loadingCtrl: LoadingController,
        _params: NavParams,
        _deviceManagerService: DeviceManagerService,
        _navCtrl: NavController
    ) {
        this.platform = _platform;
        this.modalCtrl = _modalCtrl;
        this.loadingCtrl = _loadingCtrl;
        this.navCtrl = _navCtrl;
        this.params = _params;
        this.deviceManagerService = _deviceManagerService;
        this.potentialDevices = this.params.get('potentialDevices');
        this.deviceBridgeAddress = this.params.get('deviceBridgeAddress');
        this.deviceManagerPageRef = this.params.get('deviceManagerPageRef');
        this.deviceObject = this.params.get('deviceObject');
        if (this.params.get('bridge')) {
            this.bridgeConfigure = true;
        }
        if (this.potentialDevices == null || this.potentialDevices.length < 1) {
            this.devicesEnumeration = false;
        }
        else {
            this.devicesEnumeration = true;
            this.deviceConfigure = false;
        }
        if (this.deviceObject != null) {
            let addDeviceAddress = this.deviceObject.bridge ? this.deviceObject.deviceBridgeAddress : this.deviceObject.ipAddress;
            this.deviceManagerService.addDeviceFromDescriptor(addDeviceAddress, {device: [this.deviceObject.deviceDescriptor]});
            this.deviceConfigure = true;
            this.bridgeConfigure = this.deviceObject.bridge;
            this.deviceBridgeAddress = this.bridgeConfigure === true ? this.deviceObject.deviceBridgeAddress : this.deviceBridgeAddress;
        }
    }

    reEnumerateAgent() {
        this.deviceManagerService.connectBridge(this.deviceBridgeAddress).subscribe(
            (success) => {
                console.log(success);
                if (success.agent == undefined || success.agent[0].statusCode > 0) {
                    this.deviceManagerPageRef.toastService.createToast('agentInvalidResponse', true);
                    return;
                }
                if (success.agent[0].devices.length === 0) {
                    this.deviceManagerPageRef.toastService.createToast('agentEnumerateError', true);
                    return;
                }
                this.potentialDevices = success.agent[0].devices;
                this.devicesEnumeration = true;
            },
            (err) => {
                console.log(err);
                this.deviceManagerPageRef.toastService.createToast('agentInvalidResponse', true);
            },
            () => {

            }
        );
    }

    selectDevice(selectedIndex: number) {
        let command = {
            "agent": [
                {
                    "command": "setActiveDevice",
                    "device": this.potentialDevices[selectedIndex]
                }
            ]
        };
        if (this.deviceObject != null && this.potentialDevices[selectedIndex] === this.deviceObject.connectedDeviceAddress) {
            this.deviceManagerPageRef.toastService.createToast('deviceExists');
            return;
        }

        let loading = this.deviceManagerPageRef.displayLoading();

        this.deviceManagerService.transport.writeRead('/config', JSON.stringify(command), 'json').subscribe(
            (arrayBuffer) => {
                console.log('response to set active device');
                console.log(this.deviceBridgeAddress);
                let data;
                try {
                    let stringify = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0)));
                    console.log(stringify);
                    data = JSON.parse(stringify);
                }
                catch (e) {
                    console.log('Error Parsing Set Active Device Response');
                    console.log(e);
                    loading.dismiss();
                }
                console.log(data);

                this.deviceManagerService.connect(this.deviceBridgeAddress).subscribe(
                    (data) => {
                        loading.dismiss();
                        console.log('enumeration response');
                        console.log(data);
                        if (data.device[0].statusCode == undefined || data.device[0].statusCode > 0) {
                            this.deviceManagerPageRef.toastService.createToast('enumerateError', true);
                            return;
                        }

                        if (this.deviceObject != undefined) {
                            console.log
                            this.deviceObject.connectedDeviceAddress = this.potentialDevices[selectedIndex];
                            this.deviceObject.ipAddress = this.deviceObject.deviceBridgeAddress + ' - ' + this.deviceObject.connectedDeviceAddress;
                            this.deviceManagerPageRef.storage.saveData('savedDevices', JSON.stringify(this.deviceManagerPageRef.devices));
                            this.devicesEnumeration = false;
                            this.deviceConfigure = true;
                            return;
                        }

                        let validDevice = this.deviceManagerPageRef.bridgeDeviceSelect({
                            selectedDevice: this.potentialDevices[selectedIndex],
                            deviceEnum: data
                        }, this.deviceBridgeAddress);
                        if (validDevice) {
                            this.devicesEnumeration = false;
                            this.deviceConfigure = true;
                            this.deviceObject = this.deviceManagerPageRef.devices[0];
                            this.deviceObject.connectedDeviceAddress = this.potentialDevices[selectedIndex];
                            //TODO
                            this.deviceManagerPageRef.deviceManagerService.addDeviceFromDescriptor(this.deviceBridgeAddress, {device:[this.deviceObject.deviceDescriptor]});
                        }
                    },
                    (err) => {
                        console.log(err);
                        loading.dismiss();
                        this.deviceManagerPageRef.toastService.createToast('timeout', true);
                    },
                    () => { }
                );
            },
            (err) => {
                console.log(err);
                loading.dismiss();
            },
            () => {
                console.log('complete');
            }
        );
    }

    openCalibrateWizard() {
        let modal = this.modalCtrl.create(CalibratePage,
            {
                test: 'test'
            },
            {
                enableBackdropDismiss: false
            }
        );
        modal.present();
    }

    openWifiWizard() {
        let modal = this.modalCtrl.create(WifiSetupPage,
            {
                test: 'test'
            },
            {
                enableBackdropDismiss: false
            }
        );
        modal.present();
    }

}