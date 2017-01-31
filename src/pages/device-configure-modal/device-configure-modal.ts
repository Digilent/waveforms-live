import { NavParams, Platform, NavController, ModalController, LoadingController } from 'ionic-angular';
import { Component, ViewChild } from '@angular/core';

//Components
import { DeviceManagerPage } from '../device-manager-page/device-manager-page';
import { CalibratePage } from '../calibrate/calibrate';
import { WifiSetupPage } from '../wifi-setup/wifi-setup';
import { LoadFirmwarePage } from '../load-firmware/load-firmware';
import { UpdateFirmwarePage } from '../update-firmware/update-firmware';
import { DropdownPopoverComponent } from '../../components/dropdown-popover/dropdown-popover.component';

//Interfaces
import { DeviceCardInfo } from '../device-manager-page/device-manager-page.interface';

//Services
import { DeviceManagerService } from '../../services/device/device-manager.service';
import { TooltipService } from '../../services/tooltip/tooltip.service';

@Component({
    templateUrl: "device-configure-modal.html"
})

export class DeviceConfigureModal {
    @ViewChild('dropdownPop') dropdownPopRef: DropdownPopoverComponent;
    public platform: Platform;
    public loadingCtrl: LoadingController;
    public modalCtrl: ModalController;
    public navCtrl: NavController;
    public deviceManagerService: DeviceManagerService;
    public tooltipService: TooltipService;
    public params: NavParams;

    public potentialDevices: string[];
    public selectedPotentialDeviceIndex: number = 0;
    public deviceBridgeAddress: string;
    public deviceManagerPageRef: DeviceManagerPage;
    public deviceObject: DeviceCardInfo;

    //Content controllers
    public bridgeConfigure: boolean = false;
    public deviceConfigure: boolean = false;
    public invalidEnumeration: boolean = true;

    //Leftovers from transfer. TODO wade through this
    public hostname: string = 'test';

    constructor(
        _platform: Platform,
        _modalCtrl: ModalController,
        _loadingCtrl: LoadingController,
        _params: NavParams,
        _deviceManagerService: DeviceManagerService,
        _tooltipService: TooltipService,
        _navCtrl: NavController
    ) {
        this.platform = _platform;
        this.modalCtrl = _modalCtrl;
        this.loadingCtrl = _loadingCtrl;
        this.navCtrl = _navCtrl;
        this.tooltipService = _tooltipService;
        this.params = _params;
        this.deviceManagerService = _deviceManagerService;
        this.potentialDevices = this.params.get('potentialDevices');
        this.deviceBridgeAddress = this.params.get('deviceBridgeAddress');
        this.deviceManagerPageRef = this.params.get('deviceManagerPageRef');
        this.deviceObject = this.params.get('deviceObject');
        if (this.params.get('bridge')) {
            this.bridgeConfigure = true;
        }
        if (this.deviceObject != null) {
            this.invalidEnumeration = false;
            let addDeviceAddress = this.deviceObject.bridge ? this.deviceObject.deviceBridgeAddress : this.deviceObject.ipAddress;
            this.deviceManagerService.addDeviceFromDescriptor(addDeviceAddress, { device: [this.deviceObject.deviceDescriptor] });
            if (this.deviceObject.bridge) {
                let loading = this.deviceManagerPageRef.displayLoading();
                this.setAgentActiveDeviceFromExisting().then(() => {
                    return this.reEnumerateAgent();
                })
                    .catch((e) => {
                        loading.dismiss();
                    })
                    .then(() => {
                        loading.dismiss();
                        if (this.potentialDevices && this.potentialDevices.indexOf(this.deviceObject.connectedDeviceAddress) !== -1) {
                            this.dropdownPopRef.setActiveSelection(this.deviceObject.connectedDeviceAddress);
                            this.selectedPotentialDeviceIndex = this.potentialDevices.indexOf(this.deviceObject.connectedDeviceAddress);
                        }
                    });
            }
            this.deviceConfigure = true;
            this.bridgeConfigure = this.deviceObject.bridge;
            this.deviceBridgeAddress = this.bridgeConfigure === true ? this.deviceObject.deviceBridgeAddress : this.deviceBridgeAddress;
        }
        else if (this.deviceObject == undefined && this.bridgeConfigure) {
            this.reEnumerateAgent(true);
        }
    }

    reEnumerateAgent(autoConnectToFirst?: boolean): Promise<null> {
        autoConnectToFirst = autoConnectToFirst || false;
        return new Promise((resolve, reject) => {
            this.deviceManagerService.connectBridge(this.deviceBridgeAddress).subscribe(
                (success) => {
                    resolve();
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
                    if (success.agent[0].devices.length === 1 && !this.deviceObject) {
                        this.dropdownDeviceChange(success.agent[0].devices[0]);
                    }
                    else if (success.agent[0].devices.length > 0 && autoConnectToFirst) {
                        this.dropdownDeviceChange(success.agent[0].devices[0]);
                    }
                },
                (err) => {
                    resolve();
                    console.log(err);
                    this.deviceManagerPageRef.toastService.createToast('agentInvalidResponse', true);
                },
                () => {

                }
            );

        });
    }

    setAgentActiveDeviceFromExisting(): Promise<null> {
        //Used to have agent set the device in JSON mode for serial communication.
        let command = {
            "agent": [
                {
                    "command": "setActiveDevice",
                    "device": this.deviceObject.connectedDeviceAddress
                }
            ]
        };

        this.deviceManagerService.transport.setHttpTransport(this.deviceObject.deviceBridgeAddress);

        return new Promise((resolve, reject) => {
            this.deviceManagerService.transport.writeRead('/config', JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    console.log('active device set');
                    let data;
                    try {
                        let stringify = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0)));
                        console.log(stringify);
                        data = JSON.parse(stringify);
                    }
                    catch (e) {
                        console.log('Error Parsing Set Active Device Response');
                        console.log(e);
                    }
                    if (data.agent[0] == undefined || data.agent[0].statusCode > 0) {
                        this.deviceManagerPageRef.toastService.createToast('agentConnectError', true);
                        this.invalidEnumeration = true;
                        reject();
                        return;
                    }
                    console.log(data);
                    this.enterJsonMode().then(() => {
                        resolve();
                    }).catch((e) => {
                        resolve();
                    });
                },
                (err) => {
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
    }

    enterJsonMode(): Promise<any> {
        let command = {
            "agent": [
                {
                    "command": "enterJsonMode"
                }
            ]
        };
        return new Promise((resolve, reject) => {
            this.deviceManagerService.transport.writeRead('/config', JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    console.log('enter json mode');
                    let data;
                    try {
                        let stringify = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0)));
                        console.log(stringify);
                        data = JSON.parse(stringify);
                    }
                    catch (e) {
                        console.log('Error Parsing JSON mode Device Response');
                        console.log(e);
                        reject(e);
                    }
                    if (data.agent[0] == undefined || data.agent[0].statusCode > 0) {
                        this.deviceManagerPageRef.toastService.createToast('agentConnectError', true);
                        this.invalidEnumeration = true;
                        reject();
                        return;
                    }
                    console.log(data);
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    reject(err);
                },
                () => { }
            );

        });
    }

    retryDeviceEnumeration() {
        this.selectDevice(this.selectedPotentialDeviceIndex);
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
                if (data.agent[0] == undefined || data.agent[0].statusCode > 0) {
                    console.log('Agent StatusCode Error');
                    loading.dismiss();
                    this.invalidEnumeration = true;
                    this.deviceManagerPageRef.toastService.createToast('agentConnectError', true);
                    return;
                }
                console.log(data);
                this.enterJsonMode().then(() => {
                    this.deviceManagerService.connect(this.deviceBridgeAddress).subscribe(
                        (data) => {
                            loading.dismiss();
                            console.log('enumeration response');
                            console.log(data);
                            if (data.device[0].statusCode == undefined || data.device[0].statusCode > 0) {
                                this.deviceManagerPageRef.toastService.createToast('enumerateError', true);
                                this.invalidEnumeration = true;
                                return;
                            }
                            this.invalidEnumeration = false;

                            if (this.deviceObject != undefined) {
                                this.deviceObject.connectedDeviceAddress = this.potentialDevices[selectedIndex];
                                this.deviceObject.ipAddress = this.deviceObject.deviceBridgeAddress + ' - ' + this.deviceObject.connectedDeviceAddress;
                                this.deviceManagerPageRef.storage.saveData('savedDevices', JSON.stringify(this.deviceManagerPageRef.devices));
                                this.deviceManagerService.addDeviceFromDescriptor(this.deviceObject.deviceBridgeAddress, { device: [this.deviceObject.deviceDescriptor] });
                                this.deviceConfigure = true;
                                return;
                            }

                            let validDevice = this.deviceManagerPageRef.bridgeDeviceSelect({
                                selectedDevice: this.potentialDevices[selectedIndex],
                                deviceEnum: data
                            }, this.deviceBridgeAddress);
                            if (validDevice) {
                                this.deviceConfigure = true;
                                this.deviceObject = this.deviceManagerPageRef.devices[0];
                                this.deviceObject.connectedDeviceAddress = this.potentialDevices[selectedIndex];
                                this.deviceManagerPageRef.deviceManagerService.addDeviceFromDescriptor(this.deviceBridgeAddress, { device: [this.deviceObject.deviceDescriptor] });
                            }
                        },
                        (err) => {
                            console.log(err);
                            loading.dismiss();
                            this.invalidEnumeration = true;
                            this.deviceManagerPageRef.toastService.createToast('timeout', true);
                        },
                        () => { }
                    );
                }).catch((e) => {
                    loading.dismiss();
                });


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

    dropdownDeviceChange(event) {
        console.log(event);
        this.selectedPotentialDeviceIndex = this.potentialDevices.indexOf(event);
        this.selectDevice(this.selectedPotentialDeviceIndex);

    }

    openCorrectFirmwareModal() {
        if (!this.potentialDevices) { return; }
        let page;
        let params;
        if (this.invalidEnumeration || this.deviceObject == undefined) {
            page = LoadFirmwarePage;
            params = {
                agentAddress: this.deviceObject ? this.deviceObject.deviceBridgeAddress : this.deviceBridgeAddress
            };
        }
        else {
            page = UpdateFirmwarePage;
            params = {
                agentAddress: this.deviceObject ? this.deviceObject.deviceBridgeAddress : this.deviceBridgeAddress,
                deviceObject: this.deviceObject
            };
        }
        let modal = this.modalCtrl.create(page, params, {
            enableBackdropDismiss: false
        });
        modal.present();
    }

    openCalibrateWizard() {
        let modal = this.modalCtrl.create(CalibratePage, undefined, {
            enableBackdropDismiss: false
        });
        modal.present();
    }

    openWifiWizard() {
        let modal = this.modalCtrl.create(WifiSetupPage, undefined, {
            enableBackdropDismiss: false
        });
        modal.present();
    }

}